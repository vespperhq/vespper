import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("should call the onClick handler when button is clicked", async () => {
  // ARRANGE
  const onClick = jest.fn();
  render(<button onClick={onClick}>Click me</button>);

  // ACT
  await userEvent.click(screen.getByText("Click me"));

  // ASSERT
  expect(onClick).toHaveBeenCalled();
});
