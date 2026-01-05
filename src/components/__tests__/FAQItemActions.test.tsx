import { createElement } from "react";
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FAQItemActions } from "../FAQItemActions";

describe("FAQItemActions", () => {
    const mockHandlers = {
        onEdit: jest.fn(),
        onDelete: jest.fn(),
        onMoveUp: jest.fn(),
        onMoveDown: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render all four action buttons", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        expect(screen.getByLabelText("Move FAQ item up")).toBeInTheDocument();
        expect(screen.getByLabelText("Move FAQ item down")).toBeInTheDocument();
        expect(screen.getByLabelText("Edit FAQ item")).toBeInTheDocument();
        expect(screen.getByLabelText("Delete FAQ item")).toBeInTheDocument();
    });

    it("should call onEdit when edit button is clicked", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        fireEvent.click(screen.getByLabelText("Edit FAQ item"));
        expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    });

    it("should call onDelete when delete button is clicked", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        fireEvent.click(screen.getByLabelText("Delete FAQ item"));
        expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    });

    it("should call onMoveUp when move up button is clicked", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        fireEvent.click(screen.getByLabelText("Move FAQ item up"));
        expect(mockHandlers.onMoveUp).toHaveBeenCalledTimes(1);
    });

    it("should call onMoveDown when move down button is clicked", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        fireEvent.click(screen.getByLabelText("Move FAQ item down"));
        expect(mockHandlers.onMoveDown).toHaveBeenCalledTimes(1);
    });

    it("should disable move up button when canMoveUp is false", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={false}
                canMoveDown={true}
            />
        );

        const moveUpButton = screen.getByLabelText("Move FAQ item up");
        expect(moveUpButton).toBeDisabled();
    });

    it("should disable move down button when canMoveDown is false", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={false}
            />
        );

        const moveDownButton = screen.getByLabelText("Move FAQ item down");
        expect(moveDownButton).toBeDisabled();
    });

    it("should not call handlers when disabled buttons are clicked", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={false}
                canMoveDown={false}
            />
        );

        fireEvent.click(screen.getByLabelText("Move FAQ item up"));
        fireEvent.click(screen.getByLabelText("Move FAQ item down"));

        expect(mockHandlers.onMoveUp).not.toHaveBeenCalled();
        expect(mockHandlers.onMoveDown).not.toHaveBeenCalled();
    });

    it("should stop event propagation when buttons are clicked", () => {
        const mockStopPropagation = jest.fn();
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        const editButton = screen.getByLabelText("Edit FAQ item");
        const clickEvent = new MouseEvent("click", { bubbles: true });
        clickEvent.stopPropagation = mockStopPropagation;
        
        fireEvent(editButton, clickEvent);
        expect(mockStopPropagation).toHaveBeenCalled();
    });

    it("should have proper button titles for tooltips", () => {
        render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        expect(screen.getByTitle("Move up")).toBeInTheDocument();
        expect(screen.getByTitle("Move down")).toBeInTheDocument();
        expect(screen.getByTitle("Edit FAQ")).toBeInTheDocument();
        expect(screen.getByTitle("Delete FAQ")).toBeInTheDocument();
    });

    it("should render SVG icons for all buttons", () => {
        const { container } = render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        const svgs = container.querySelectorAll("svg");
        expect(svgs).toHaveLength(4);
    });

    it("should have correct CSS classes", () => {
        const { container } = render(
            <FAQItemActions
                {...mockHandlers}
                canMoveUp={true}
                canMoveDown={true}
            />
        );

        expect(container.querySelector(".faq-item-actions")).toBeInTheDocument();
        expect(container.querySelector(".faq-item-action-btn")).toBeInTheDocument();
        expect(container.querySelector(".faq-action-move-up")).toBeInTheDocument();
        expect(container.querySelector(".faq-action-move-down")).toBeInTheDocument();
        expect(container.querySelector(".faq-action-edit")).toBeInTheDocument();
        expect(container.querySelector(".faq-action-delete")).toBeInTheDocument();
    });
});
