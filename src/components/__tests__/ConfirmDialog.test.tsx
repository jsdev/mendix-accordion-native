import { createElement } from "react";
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
    const mockHandlers = {
        onConfirm: jest.fn(),
        onCancel: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render dialog when isOpen is true", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test Title"
                message="Test message"
                {...mockHandlers}
            />
        );

        expect(screen.getByText("Test Title")).toBeInTheDocument();
        expect(screen.getByText("Test message")).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={false}
                title="Test Title"
                message="Test message"
                {...mockHandlers}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it("should call onConfirm when confirm button is clicked", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test Title"
                message="Test message"
                {...mockHandlers}
            />
        );

        fireEvent.click(screen.getByText("Confirm"));
        expect(mockHandlers.onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onCancel when cancel button is clicked", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test Title"
                message="Test message"
                {...mockHandlers}
            />
        );

        fireEvent.click(screen.getByText("Cancel"));
        expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
    });

    it("should use custom button text when provided", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test Title"
                message="Test message"
                confirmText="Yes, Delete"
                cancelText="No, Keep"
                {...mockHandlers}
            />
        );

        expect(screen.getByText("Yes, Delete")).toBeInTheDocument();
        expect(screen.getByText("No, Keep")).toBeInTheDocument();
    });

    it("should show warning icon when isDestructive is true", () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={true}
                title="Delete Item"
                message="Are you sure?"
                isDestructive={true}
                {...mockHandlers}
            />
        );

        const warningIcon = container.querySelector(".faq-confirm-dialog-icon-warning");
        expect(warningIcon).toBeInTheDocument();
    });

    it("should not show warning icon when isDestructive is false", () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={true}
                title="Confirm Action"
                message="Are you sure?"
                isDestructive={false}
                {...mockHandlers}
            />
        );

        const warningIcon = container.querySelector(".faq-confirm-dialog-icon-warning");
        expect(warningIcon).not.toBeInTheDocument();
    });

    it("should apply destructive class to confirm button when isDestructive is true", () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={true}
                title="Delete"
                message="Are you sure?"
                isDestructive={true}
                {...mockHandlers}
            />
        );

        const confirmButton = screen.getByText("Confirm");
        expect(confirmButton).toHaveClass("faq-btn-destructive");
    });

    it("should call onCancel when overlay is clicked", () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={true}
                title="Test"
                message="Test"
                {...mockHandlers}
            />
        );

        const overlay = container.querySelector(".faq-confirm-dialog-overlay");
        if (overlay) {
            fireEvent.click(overlay);
            expect(mockHandlers.onCancel).toHaveBeenCalledTimes(1);
        }
    });

    it("should not call onCancel when dialog content is clicked", () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={true}
                title="Test"
                message="Test"
                {...mockHandlers}
            />
        );

        const dialog = container.querySelector(".faq-confirm-dialog");
        if (dialog) {
            fireEvent.click(dialog);
            expect(mockHandlers.onCancel).not.toHaveBeenCalled();
        }
    });

    it("should have proper ARIA attributes", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test Title"
                message="Test message"
                {...mockHandlers}
            />
        );

        const dialog = screen.getByRole("alertdialog");
        expect(dialog).toHaveAttribute("aria-labelledby", "dialog-title");
        expect(dialog).toHaveAttribute("aria-describedby", "dialog-message");
    });

    it("should have correct element IDs for ARIA", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test Title"
                message="Test message"
                {...mockHandlers}
            />
        );

        expect(screen.getByText("Test Title")).toHaveAttribute("id", "dialog-title");
        expect(screen.getByText("Test message")).toHaveAttribute("id", "dialog-message");
    });

    it("should have correct CSS classes for styling", () => {
        const { container } = render(
            <ConfirmDialog
                isOpen={true}
                title="Test"
                message="Test"
                {...mockHandlers}
            />
        );

        expect(container.querySelector(".faq-confirm-dialog-overlay")).toBeInTheDocument();
        expect(container.querySelector(".faq-confirm-dialog")).toBeInTheDocument();
        expect(container.querySelector(".faq-confirm-dialog-header")).toBeInTheDocument();
        expect(container.querySelector(".faq-confirm-dialog-message")).toBeInTheDocument();
        expect(container.querySelector(".faq-confirm-dialog-actions")).toBeInTheDocument();
        expect(container.querySelector(".faq-btn-cancel")).toBeInTheDocument();
        expect(container.querySelector(".faq-btn-confirm")).toBeInTheDocument();
    });

    it("should default to 'Confirm' and 'Cancel' button text", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                title="Test"
                message="Test"
                {...mockHandlers}
            />
        );

        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
});
