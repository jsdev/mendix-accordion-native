import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FAQItemActions } from "../FAQItemActions";

describe("FAQItemActions", () => {
    const mockHandlers = {
        onEdit: jest.fn(),
        onDelete: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render edit and delete action buttons", () => {
        render(<FAQItemActions {...mockHandlers} />);

        expect(screen.getByLabelText("Edit FAQ item")).toBeInTheDocument();
        expect(screen.getByLabelText("Delete FAQ item")).toBeInTheDocument();
    });

    it("should call onEdit when edit button is clicked", () => {
        render(<FAQItemActions {...mockHandlers} />);

        fireEvent.click(screen.getByLabelText("Edit FAQ item"));
        expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    });

    it("should call onDelete when delete button is clicked", () => {
        render(<FAQItemActions {...mockHandlers} />);

        fireEvent.click(screen.getByLabelText("Delete FAQ item"));
        expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    });

    it("should stop event propagation when buttons are clicked", () => {
        const mockStopPropagation = jest.fn();
        render(<FAQItemActions {...mockHandlers} />);

        const editButton = screen.getByLabelText("Edit FAQ item");
        const clickEvent = new MouseEvent("click", { bubbles: true });
        clickEvent.stopPropagation = mockStopPropagation;

        fireEvent(editButton, clickEvent);
        expect(mockStopPropagation).toHaveBeenCalled();
    });

    it("should have proper button titles for tooltips", () => {
        render(<FAQItemActions {...mockHandlers} />);

        expect(screen.getByTitle("Edit FAQ")).toBeInTheDocument();
        expect(screen.getByTitle("Delete FAQ")).toBeInTheDocument();
    });

    it("should render SVG icons for all buttons", () => {
        const { container } = render(<FAQItemActions {...mockHandlers} />);

        const svgs = container.querySelectorAll("svg");
        expect(svgs).toHaveLength(2);
    });

    it("should have correct CSS classes", () => {
        const { container } = render(<FAQItemActions {...mockHandlers} />);

        expect(container.querySelector(".faq-item-actions")).toBeInTheDocument();
        expect(container.querySelector(".faq-item-action-btn")).toBeInTheDocument();
        expect(container.querySelector(".faq-action-edit")).toBeInTheDocument();
        expect(container.querySelector(".faq-action-delete")).toBeInTheDocument();
    });
});
