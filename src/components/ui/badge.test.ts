import { describe, expect, it } from "vitest";

import { statusBadgeTone } from "./badge";

describe("statusBadgeTone", () => {
  it("maps draft to gray", () => {
    expect(statusBadgeTone("draft")).toBe("gray");
  });

  it("maps sent to blue", () => {
    expect(statusBadgeTone("sent")).toBe("blue");
  });

  it("maps accepted to green", () => {
    expect(statusBadgeTone("accepted")).toBe("green");
  });

  it("maps rejected to red", () => {
    expect(statusBadgeTone("rejected")).toBe("red");
  });
});
