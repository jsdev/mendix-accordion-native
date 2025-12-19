/**
 * This file was generated from FAQAccordion.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { CSSProperties } from "react";
import { ActionValue, DynamicValue, ListValue, ListAttributeValue } from "mendix";
import { Big } from "big.js";

export type DataSourceTypeEnum = "static" | "database";

export type ContentFormatEnum = "html" | "markdown" | "text";

export interface FaqItemsType {
    summary: DynamicValue<string>;
    content: DynamicValue<string>;
    contentFormat: ContentFormatEnum;
}

export interface FaqItemsPreviewType {
    summary: string;
    content: string;
    contentFormat: ContentFormatEnum;
}

export interface FAQAccordionContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    dataSourceType: DataSourceTypeEnum;
    faqItems: FaqItemsType[];
    dataSource?: ListValue;
    summaryAttribute?: ListAttributeValue<string>;
    contentAttribute?: ListAttributeValue<string>;
    formatAttribute?: ListAttributeValue<string>;
    allowEditing: boolean;
    editorRole: string;
    onSaveAction?: ActionValue;
    onDeleteAction?: ActionValue;
    onCreateAction?: ActionValue;
    sortOrderAttribute?: ListAttributeValue<Big>;
    defaultExpandAll: boolean;
    showToggleButton: boolean;
    toggleButtonText?: DynamicValue<string>;
    animationDuration: number;
}

export interface FAQAccordionPreviewProps {
    /**
     * @deprecated Deprecated since version 9.18.0. Please use class property instead.
     */
    className: string;
    class: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    renderMode: "design" | "xray" | "structure";
    translate: (text: string) => string;
    dataSourceType: DataSourceTypeEnum;
    faqItems: FaqItemsPreviewType[];
    dataSource: {} | { caption: string } | { type: string } | null;
    summaryAttribute: string;
    contentAttribute: string;
    formatAttribute: string;
    allowEditing: boolean;
    editorRole: string;
    onSaveAction: {} | null;
    onDeleteAction: {} | null;
    onCreateAction: {} | null;
    sortOrderAttribute: string;
    defaultExpandAll: boolean;
    showToggleButton: boolean;
    toggleButtonText: string;
    animationDuration: number | null;
}
