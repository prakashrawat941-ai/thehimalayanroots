const STYLES: Record<string, string> = {
  pending: "bg-saffron/20 text-clay",
  confirmed: "bg-forest-500/20 text-forest-800",
  completed: "bg-forest-900/10 text-forest-900",
  cancelled: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STYLES[status] ?? STYLES.pending}`}>{status}</span>;
}
