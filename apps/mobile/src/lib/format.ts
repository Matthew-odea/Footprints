export function formatCountLabel(count: number): string {
    if (count === 1) {
        return "1 completion";
    }
    return `${count} completions`;
}
