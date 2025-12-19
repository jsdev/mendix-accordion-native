import { ReactElement, createElement, useState, useEffect } from "react";
import { ContentFormatEnum } from "../../typings/FAQAccordionProps";
import { processContent, getContentWarnings } from "../utils/contentProcessor";
import classNames from "classnames";

interface EditFAQFormProps {
    summary: string;
    content: string;
    format: ContentFormatEnum;
    onSave: (summary: string, content: string, format: ContentFormatEnum) => void;
    onCancel: () => void;
    isNew?: boolean;
}

export function EditFAQForm(props: EditFAQFormProps): ReactElement {
    const { summary: initialSummary, content: initialContent, format: initialFormat, onSave, onCancel, isNew = false } = props;

    const [summary, setSummary] = useState(initialSummary);
    const [content, setContent] = useState(initialContent);
    const [format, setFormat] = useState<ContentFormatEnum>(initialFormat);
    const [showPreview, setShowPreview] = useState(false);

    // Validation warnings
    const warnings = getContentWarnings(content, format);
    const hasWarnings = warnings.length > 0;

    const handleSave = () => {
        if (!summary.trim()) {
            alert("Summary/Question is required");
            return;
        }
        if (!content.trim()) {
            alert("Content/Answer is required");
            return;
        }
        onSave(summary.trim(), content.trim(), format);
    };

    return (
        <div className="faq-edit-form">
            <div className="faq-edit-form-header">
                <h3>{isNew ? "Add New FAQ" : "Edit FAQ"}</h3>
                <button
                    className="faq-edit-form-close"
                    onClick={onCancel}
                    type="button"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>

            <div className="faq-edit-form-body">
                {/* Summary Field */}
                <div className="faq-form-field">
                    <label htmlFor="faq-summary">
                        Question/Summary <span className="faq-required">*</span>
                    </label>
                    <input
                        id="faq-summary"
                        type="text"
                        className="faq-form-input"
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        placeholder="Enter the question or summary..."
                        required
                    />
                </div>

                {/* Format Field */}
                <div className="faq-form-field">
                    <label htmlFor="faq-format">
                        Content Format <span className="faq-required">*</span>
                    </label>
                    <select
                        id="faq-format"
                        className="faq-form-select"
                        value={format}
                        onChange={(e) => setFormat(e.target.value as ContentFormatEnum)}
                    >
                        <option value="html">HTML</option>
                        <option value="markdown">Markdown</option>
                        <option value="text">Plain Text</option>
                    </select>
                    <small className="faq-form-help">
                        {format === "html" && "Allows rich formatting with HTML tags"}
                        {format === "markdown" && "Uses Markdown syntax (e.g., **bold**, # heading)"}
                        {format === "text" && "Plain text only, HTML will be escaped"}
                    </small>
                </div>

                {/* Content Field */}
                <div className="faq-form-field">
                    <label htmlFor="faq-content">
                        Answer/Content <span className="faq-required">*</span>
                    </label>
                    <textarea
                        id="faq-content"
                        className={classNames("faq-form-textarea", {
                            "faq-form-textarea--warning": hasWarnings
                        })}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter the answer or content..."
                        rows={10}
                        required
                    />
                    
                    {/* Validation Warnings */}
                    {hasWarnings && (
                        <div className="faq-form-warnings">
                            <strong>⚠️ Content Warnings:</strong>
                            <ul>
                                {warnings.map((warning, i) => (
                                    <li key={i}>{warning}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Preview Toggle */}
                <div className="faq-form-field">
                    <button
                        type="button"
                        className="faq-preview-toggle"
                        onClick={() => setShowPreview(!showPreview)}
                    >
                        {showPreview ? "Hide" : "Show"} Preview
                    </button>
                </div>

                {/* Preview */}
                {showPreview && (
                    <div className="faq-form-preview">
                        <h4>Preview:</h4>
                        <div
                            className="faq-form-preview-content"
                            dangerouslySetInnerHTML={{ __html: processContent(content, format) }}
                        />
                    </div>
                )}
            </div>

            {/* Form Actions */}
            <div className="faq-edit-form-footer">
                <button
                    type="button"
                    className="faq-btn faq-btn-secondary"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="faq-btn faq-btn-primary"
                    onClick={handleSave}
                    disabled={!summary.trim() || !content.trim()}
                >
                    {isNew ? "Create FAQ" : "Save Changes"}
                </button>
            </div>
        </div>
    );
}
