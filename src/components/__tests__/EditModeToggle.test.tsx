import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { EditModeToggle } from "../EditModeToggle";

describe("EditModeToggle", () => {
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should render edit mode button when editMode is false", () => {
        render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        expect(screen.getByText("Edit")).toBeInTheDocument();
        expect(screen.getByLabelText("Switch to edit mode")).toBeInTheDocument();
    });

    it("should render view mode button when editMode is true", () => {
        render(<EditModeToggle editMode={true} onToggle={mockOnToggle} />);

        expect(screen.getByText("View")).toBeInTheDocument();
        expect(screen.getByLabelText("Switch to view mode")).toBeInTheDocument();
    });

    it("should call onToggle when button is clicked", () => {
        render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        fireEvent.click(screen.getByRole("button"));
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when disabled prop is true", () => {
        render(<EditModeToggle editMode={false} onToggle={mockOnToggle} disabled={true} />);

        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
    });

    it("should not call onToggle when disabled button is clicked", () => {
        render(<EditModeToggle editMode={false} onToggle={mockOnToggle} disabled={true} />);

        fireEvent.click(screen.getByRole("button"));
        expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it("should have active class when in edit mode", () => {
        const { container } = render(<EditModeToggle editMode={true} onToggle={mockOnToggle} />);

        const button = container.querySelector(".faq-edit-mode-toggle");
        expect(button).toHaveClass("faq-edit-mode-active");
    });

    it("should not have active class when in view mode", () => {
        const { container } = render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        const button = container.querySelector(".faq-edit-mode-toggle");
        expect(button).not.toHaveClass("faq-edit-mode-active");
    });

    it("should render pencil icon in edit mode button", () => {
        const { container } = render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });

    it("should render eye icon in view mode button", () => {
        const { container } = render(<EditModeToggle editMode={true} onToggle={mockOnToggle} />);

        const svg = container.querySelector("svg");
        expect(svg).toBeInTheDocument();
    });

    it("should have correct title attribute for edit mode", () => {
        render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        expect(screen.getByTitle("Edit Mode")).toBeInTheDocument();
    });

    it("should have correct title attribute for view mode", () => {
        render(<EditModeToggle editMode={true} onToggle={mockOnToggle} />);

        expect(screen.getByTitle("View Mode")).toBeInTheDocument();
    });

    it("should default disabled to false", () => {
        render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        const button = screen.getByRole("button");
        expect(button).not.toBeDisabled();
    });

    it("should have correct base CSS class", () => {
        const { container } = render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        expect(container.querySelector(".faq-edit-mode-toggle")).toBeInTheDocument();
    });

    it("should render both icon and text", () => {
        const { container } = render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        const svg = container.querySelector("svg");
        const text = screen.getByText("Edit");

        expect(svg).toBeInTheDocument();
        expect(text).toBeInTheDocument();
    });

    it("should have type='button' attribute", () => {
        render(<EditModeToggle editMode={false} onToggle={mockOnToggle} />);

        const button = screen.getByRole("button");
        expect(button).toHaveAttribute("type", "button");
    });
});
