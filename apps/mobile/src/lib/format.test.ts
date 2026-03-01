import { formatCountLabel } from "./format";

describe("formatCountLabel", () => {
    it("formats singular", () => {
        expect(formatCountLabel(1)).toBe("1 completion");
    });

    it("formats plural", () => {
        expect(formatCountLabel(2)).toBe("2 completions");
    });
});
