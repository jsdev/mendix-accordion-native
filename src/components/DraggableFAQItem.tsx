import { ReactElement } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import { FAQItemActions } from "./FAQItemActions";

interface DraggableFAQItemProps {
    id: string;
    index: number;
    summary: string;
    processedContent: string;
    warnings: string[];
    animationDuration: number;
    onEdit: () => void;
    onDelete: () => void;
    collapseAll?: boolean;
}

export function DraggableFAQItem({
    id,
    index,
    summary,
    processedContent,
    warnings,
    animationDuration,
    onEdit,
    onDelete,
    collapseAll = false
}: DraggableFAQItemProps): ReactElement {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        "--animation-duration": `${animationDuration}ms`
    } as React.CSSProperties;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={classNames("faq-item", "faq-item--edit-mode", {
                open: !collapseAll,
                "faq-item--dragging": isDragging
            })}
        >
            <div className="faq-item-header-edit">
                {/* Drag Handle */}
                <button
                    className="faq-drag-handle"
                    {...attributes}
                    {...listeners}
                    aria-label={`Drag to reorder FAQ item ${index + 1}: ${summary}`}
                    type="button"
                >
                    <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2m-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2m0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2"></path>
                    </svg>
                </button>

                <span className="faq-item-summary-text">{summary}</span>

                <div>
                    <FAQItemActions onEdit={onEdit} onDelete={onDelete} />
                </div>
            </div>
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
        </div>
    );
}
