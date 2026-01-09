import { ReactElement, useState } from "react";
import { processContent, getContentWarnings } from "../utils/contentProcessor";
import { DraggableFAQItem } from "./DraggableFAQItem";
import { EditFAQForm } from "./EditFAQForm";
import { FAQItem } from "../hooks/useFAQData";
import { ContentFormatEnum } from "../../typings/FAQAccordionProps";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";

interface FAQEditableListProps {
    items: FAQItem[];
    sortableIds: string[];
    expandedItems: Set<number>;
    animationDuration: number;
    onEditItem: (index: number) => void;
    onDeleteItem: (index: number) => void;
    onDragEnd: (event: DragEndEvent) => void;
    // Inline editing props
    editingItemIndex: number | null;
    editingSortOrder: number | undefined;
    defaultSortOrder: number;
    onSaveEdit: (
        summary: string,
        content: string,
        format: ContentFormatEnum,
        sortOrder: number
    ) => Promise<void>;
    onCancelEdit: () => void;
    // Inline create props
    showCreateForm: boolean;
    onSaveNew: (
        summary: string,
        content: string,
        format: ContentFormatEnum,
        sortOrder: number
    ) => Promise<void>;
    onCancelCreate: () => void;
}

/**
 * Renders the FAQ items list in edit mode with drag-and-drop reordering
 */
export function FAQEditableList({
    items,
    sortableIds,
    expandedItems,
    animationDuration,
    onEditItem,
    onDeleteItem,
    onDragEnd,
    editingItemIndex,
    editingSortOrder,
    defaultSortOrder,
    onSaveEdit,
    onCancelEdit,
    showCreateForm,
    onSaveNew,
    onCancelCreate
}: FAQEditableListProps): ReactElement {
    const [isDraggingAny, setIsDraggingAny] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragStart = (_event: DragStartEvent) => {
        setIsDraggingAny(true);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setIsDraggingAny(false);
        onDragEnd(event);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <div className="faq-accordion-items faq-accordion-items--edit-mode">
                    {/* Inline Create Form - appears at top of list */}
                    {showCreateForm && (
                        <div className="faq-item faq-item--inline-create">
                            <EditFAQForm
                                summary=""
                                content=""
                                format="html"
                                sortOrder={defaultSortOrder}
                                onSave={onSaveNew}
                                onCancel={onCancelCreate}
                                isNew={true}
                                isInline={true}
                            />
                        </div>
                    )}

                    {items.map((item, index) => {
                        // If this item is being edited, show the inline form
                        if (editingItemIndex === index) {
                            return (
                                <div
                                    key={sortableIds[index]}
                                    className="faq-item faq-item--inline-edit"
                                >
                                    <EditFAQForm
                                        summary={item.summary}
                                        content={item.content}
                                        format={item.contentFormat}
                                        sortOrder={editingSortOrder ?? defaultSortOrder}
                                        onSave={onSaveEdit}
                                        onCancel={onCancelEdit}
                                        isNew={false}
                                        isInline={true}
                                    />
                                </div>
                            );
                        }

                        const processedContent = processContent(item.content, item.contentFormat);
                        const warnings = getContentWarnings(item.content, item.contentFormat);

                        return (
                            <DraggableFAQItem
                                key={sortableIds[index]}
                                id={sortableIds[index]}
                                index={index}
                                summary={item.summary}
                                processedContent={processedContent}
                                warnings={warnings}
                                animationDuration={animationDuration}
                                onEdit={() => onEditItem(index)}
                                onDelete={() => onDeleteItem(index)}
                                collapseAll={isDraggingAny}
                            />
                        );
                    })}
                </div>
            </SortableContext>
        </DndContext>
    );
}
