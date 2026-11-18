import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClarifyingQuestion } from "./ClarifyingQuestion";
import type { AgentRunQuestion } from "../model/agentRun.schema";

const QUESTION: AgentRunQuestion = {
  text: "Is the product’s principal function fully described above?",
  options: [
    { label: "Yes", hint: "The description covers its primary use" },
    { label: "No", hint: "The product has another important function" },
    { label: "I’m not sure", hint: "Continue with lower confidence" },
  ],
};

describe("ClarifyingQuestion", () => {
  it("renders the question and focuses the heading", () => {
    render(<ClarifyingQuestion question={QUESTION} isPending={false} onAnswer={() => {}} />);
    expect(screen.getByText(QUESTION.text)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /clarifying question/i })).toHaveFocus();
  });

  it("calls onAnswer with the clicked option's index", async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<ClarifyingQuestion question={QUESTION} isPending={false} onAnswer={onAnswer} />);

    await user.click(screen.getByRole("button", { name: /no.*the product has another/i }));
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it("disables all options and sets aria-busy while pending", () => {
    render(<ClarifyingQuestion question={QUESTION} isPending onAnswer={() => {}} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByText(QUESTION.text).closest("div")).toHaveAttribute("aria-busy", "true");
  });

  it("shows an error message when answering failed", () => {
    render(
      <ClarifyingQuestion
        question={QUESTION}
        isPending={false}
        error="We couldn't send your answer. Try again."
        onAnswer={() => {}}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't send your answer.");
  });
});
