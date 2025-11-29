/**
 * This file was generated from NativeAccordion.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix Widgets Framework Team
 */
import { ComponentType, CSSProperties, ReactNode } from "react";

export interface GroupsType {
    header: string;
    content?: ReactNode;
}

export interface GroupsPreviewType {
    header: string;
    content: { widgetCount: number; renderer: ComponentType<{ children: ReactNode; caption?: string }> };
}

export interface NativeAccordionContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    groups: GroupsType[];
    singleOpen: boolean;
}

export interface NativeAccordionPreviewProps {
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
    groups: GroupsPreviewType[];
    singleOpen: boolean;
}
