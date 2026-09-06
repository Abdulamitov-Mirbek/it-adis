/**
 * The gradient options a mentor card can use.
 *
 * A fixed list rather than a free-text field for a reason Tailwind enforces:
 * class names are extracted from source at build time, so a gradient typed into
 * the admin form would produce a class that exists in the database and nowhere
 * in the stylesheet — the card would render with no background at all. Every
 * value here appears literally in this file, which is what gets it compiled.
 */
export const TEACHER_COLORS = [
  { value: "from-green-500 to-emerald-700", label: "Green" },
  { value: "from-blue-500 to-blue-700", label: "Blue" },
  { value: "from-cyan-500 to-sky-700", label: "Cyan" },
  { value: "from-violet-500 to-purple-700", label: "Violet" },
  { value: "from-pink-500 to-rose-700", label: "Pink" },
  { value: "from-amber-500 to-orange-600", label: "Amber" },
  { value: "from-teal-500 to-teal-700", label: "Teal" },
  { value: "from-yellow-500 to-orange-600", label: "Yellow" },
] as const;

const KNOWN = new Set(TEACHER_COLORS.map((option) => option.value));

/**
 * Falls back to the first option for a value that is not in the list — a row
 * seeded before an option was renamed, say. Without this the card would render
 * an unstyled grey block and look broken rather than merely off-palette.
 */
export function teacherColor(value: string | null | undefined): string {
  return value && KNOWN.has(value as (typeof TEACHER_COLORS)[number]["value"])
    ? value
    : TEACHER_COLORS[0].value;
}
