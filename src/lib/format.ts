// Indian number formatting helpers.

export function rupees(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const str = rounded.toLocaleString("en-IN", {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return "₹" + str;
}

export function plainNumber(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isSameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

export function todayISO(): string {
  return new Date().toISOString();
}
