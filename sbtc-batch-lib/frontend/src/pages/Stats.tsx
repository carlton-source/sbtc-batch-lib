import { useState, useMemo, useCallback } from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import { NavBar } from "@/components/NavBar";
import { Users, Zap, ArrowUpRight, BarChart2, ChevronUp, ChevronDown, Search, X, Download, CalendarIcon, FileDown } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Range = "7d" | "30d" | "90d" | "custom";
type SortKey = "address" | "received" | "totalSats";
type SortDir = "asc" | "desc";

// ── 7-day dataset (Mon–Sun) ──────────────────────────────────────────────────
const weeklyData = [
  { day: "Mon", batches: 24, sats: 4800000 },
  { day: "Tue", batches: 37, sats: 7200000 },
  { day: "Wed", batches: 18, sats: 3100000 },
  { day: "Thu", batches: 52, sats: 11500000 },
  { day: "Fri", batches: 45, sats: 9800000 },
  { day: "Sat", batches: 29, sats: 5400000 },
  { day: "Sun", batches: 61, sats: 13200000 },
];

// ── 30-day dataset (daily buckets, short date labels) ────────────────────────
const thirtyDayData = [
  { day: "Jan 22", batches: 31, sats: 6200000 },
  { day: "Jan 23", batches: 27, sats: 5100000 },
  { day: "Jan 24", batches: 44, sats: 8800000 },
  { day: "Jan 25", batches: 19, sats: 3800000 },
  { day: "Jan 26", batches: 55, sats: 11000000 },
  { day: "Jan 27", batches: 38, sats: 7600000 },
  { day: "Jan 28", batches: 62, sats: 12400000 },
  { day: "Jan 29", batches: 41, sats: 8200000 },
  { day: "Jan 30", batches: 33, sats: 6600000 },
  { day: "Jan 31", batches: 48, sats: 9600000 },
  { day: "Feb 1",  batches: 25, sats: 5000000 },
  { day: "Feb 2",  batches: 57, sats: 11400000 },
  { day: "Feb 3",  batches: 36, sats: 7200000 },
  { day: "Feb 4",  batches: 43, sats: 8600000 },
  { day: "Feb 5",  batches: 29, sats: 5800000 },
  { day: "Feb 6",  batches: 51, sats: 10200000 },
  { day: "Feb 7",  batches: 68, sats: 13600000 },
  { day: "Feb 8",  batches: 39, sats: 7800000 },
  { day: "Feb 9",  batches: 22, sats: 4400000 },
  { day: "Feb 10", batches: 46, sats: 9200000 },
  { day: "Feb 11", batches: 53, sats: 10600000 },
  { day: "Feb 12", batches: 35, sats: 7000000 },
  { day: "Feb 13", batches: 61, sats: 12200000 },
  { day: "Feb 14", batches: 28, sats: 5600000 },
  { day: "Feb 15", batches: 47, sats: 9400000 },
  { day: "Feb 16", batches: 40, sats: 8000000 },
  { day: "Feb 17", batches: 58, sats: 11600000 },
  { day: "Feb 18", batches: 32, sats: 6400000 },
  { day: "Feb 19", batches: 49, sats: 9800000 },
  { day: "Feb 20", batches: 64, sats: 12800000 },
];

// ── 90-day dataset (weekly buckets W1–W13) ───────────────────────────────────
const ninetyDayData = [
  { day: "W1",  batches: 198, sats: 39600000 },
  { day: "W2",  batches: 241, sats: 48200000 },
  { day: "W3",  batches: 175, sats: 35000000 },
  { day: "W4",  batches: 312, sats: 62400000 },
  { day: "W5",  batches: 287, sats: 57400000 },
  { day: "W6",  batches: 221, sats: 44200000 },
  { day: "W7",  batches: 348, sats: 69600000 },
  { day: "W8",  batches: 263, sats: 52600000 },
  { day: "W9",  batches: 194, sats: 38800000 },
  { day: "W10", batches: 329, sats: 65800000 },
  { day: "W11", batches: 276, sats: 55200000 },
  { day: "W12", batches: 318, sats: 63600000 },
  { day: "W13", batches: 266, sats: 53200000 },
];

const chartDataByRange: Record<Exclude<Range, "custom">, typeof weeklyData> = {
  "7d":  weeklyData,
  "30d": thirtyDayData,
  "90d": ninetyDayData,
};

const subtitleByRange: Record<Exclude<Range, "custom">, string> = {
  "7d":  "Batches sent per day",
  "30d": "Batches sent over last 30 days",
  "90d": "Batches sent over last 90 days (weekly)",
};

const quickStatsTitleByRange: Record<Exclude<Range, "custom">, string> = {
  "7d":  "This Week",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
};

const quickStatsByRange: Record<Exclude<Range, "custom">, { label: string; value: string }[]> = {
  "7d": [
    { label: "Avg batch size", value: "41 recipients" },
    { label: "Avg amount", value: "215,000 sats" },
    { label: "Peak day", value: "Sunday" },
    { label: "Success rate", value: "98.4%" },
    { label: "Total gas saved", value: "~2.1B sats" },
    { label: "Avg fee per batch", value: "~3,800 sats" },
  ],
  "30d": [
    { label: "Avg batch size", value: "38 recipients" },
    { label: "Avg amount", value: "198,000 sats" },
    { label: "Peak day", value: "Feb 7" },
    { label: "Success rate", value: "98.1%" },
    { label: "Total gas saved", value: "~8.7B sats" },
    { label: "Avg fee per batch", value: "~3,950 sats" },
  ],
  "90d": [
    { label: "Avg batch size", value: "35 recipients" },
    { label: "Avg amount", value: "187,000 sats" },
    { label: "Peak week", value: "W7" },
    { label: "Success rate", value: "97.8%" },
    { label: "Total gas saved", value: "~24.3B sats" },
    { label: "Avg fee per batch", value: "~4,100 sats" },
  ],
};

// ── Static summary cards ─────────────────────────────────────────────────────
const topRecipients = [
  {
    rank: 1, address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ", received: 28, totalSats: 14200000,
    batchBreakdown: [
      { batch: "B1", sats: 620000 }, { batch: "B2", sats: 480000 }, { batch: "B3", sats: 2100000 },
      { batch: "B4", sats: 1850000 }, { batch: "B5", sats: 3200000 }, { batch: "B6", sats: 1750000 },
      { batch: "B7", sats: 2400000 }, { batch: "B8", sats: 1800000 },
    ],
  },
  {
    rank: 2, address: "SP3GWX3NE58KJET25ZZ6D193D4D3EMXT5E8KXNJV", received: 21, totalSats: 9800000,
    batchBreakdown: [
      { batch: "B1", sats: 980000 }, { batch: "B2", sats: 1540000 }, { batch: "B3", sats: 720000 },
      { batch: "B4", sats: 2100000 }, { batch: "B5", sats: 880000 }, { batch: "B6", sats: 1960000 },
      { batch: "B7", sats: 1620000 },
    ],
  },
  {
    rank: 3, address: "SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8K", received: 19, totalSats: 8100000,
    batchBreakdown: [
      { batch: "B1", sats: 650000 }, { batch: "B2", sats: 1800000 }, { batch: "B3", sats: 1100000 },
      { batch: "B4", sats: 2200000 }, { batch: "B5", sats: 750000 }, { batch: "B6", sats: 1600000 },
    ],
  },
  {
    rank: 4, address: "SP4FBZ6ME58KJET25ZZ6D193D4D3EMXT5E9YQRVZ", received: 15, totalSats: 6500000,
    batchBreakdown: [
      { batch: "B1", sats: 1200000 }, { batch: "B2", sats: 850000 }, { batch: "B3", sats: 1950000 },
      { batch: "B4", sats: 640000 }, { batch: "B5", sats: 1860000 },
    ],
  },
  {
    rank: 5, address: "SP7MKQ3ZY48GV1EZ5V2V5RB9MP77TW97QZKNRV8F", received: 12, totalSats: 5200000,
    batchBreakdown: [
      { batch: "B1", sats: 920000 }, { batch: "B2", sats: 560000 }, { batch: "B3", sats: 1480000 },
      { batch: "B4", sats: 780000 }, { batch: "B5", sats: 1460000 },
    ],
  },
];

const statCards = [
  {
    label: "Total Batches",
    value: "12,847",
    delta: "+8.2%",
    icon: BarChart2,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  {
    label: "Total Recipients",
    value: "847,293",
    delta: "+12.4%",
    icon: Users,
    color: "text-gold",
    bg: "bg-gold/10",
    border: "border-gold/20",
  },
  {
    label: "Total Sats Sent",
    value: "2.41B",
    delta: "+15.7%",
    icon: Zap,
    color: "text-emerald-400",
    bg: "bg-emerald/10",
    border: "border-emerald/20",
  },
  {
    label: "Avg Batch Size",
    value: "65.9",
    delta: "+3.1%",
    icon: ArrowUpRight,
    color: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/20",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatYAxis = (value: number): string => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return String(value);
};

// ── Batch status donut data ──────────────────────────────────────────────────
const batchStatusData = [
  { name: "Confirmed", value: 11_634, color: "hsl(160 84% 39%)" },
  { name: "Pending",   value:    972, color: "hsl(38 92% 50%)" },
  { name: "Failed",    value:    241, color: "hsl(0 72% 51%)" },
];
const batchStatusTotal = batchStatusData.reduce((s, d) => s + d.value, 0);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const satsVal = payload.find((p: any) => p.dataKey === "sats")?.value ?? 0;
    const batchVal = payload.find((p: any) => p.dataKey === "batches")?.value ?? 0;
    return (
      <div className="rounded-lg border border-border/60 bg-surface-2 p-3 shadow-card-dark">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-mono text-sm font-semibold text-foreground">
          {(satsVal / 1_000_000).toFixed(1)}M sats
        </p>
        <p className="font-mono text-xs text-muted-foreground">
          {batchVal} batches
        </p>
      </div>
    );
  }
  return null;
};

const LineTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const batches = payload.find((p: any) => p.dataKey === "batches")?.value ?? 0;
    const failed  = payload.find((p: any) => p.dataKey === "failedBatches")?.value ?? 0;
    const rate    = batches > 0 ? (((batches - failed) / batches) * 100).toFixed(1) : "—";
    return (
      <div className="rounded-lg border border-border/60 bg-surface-2 p-3 shadow-card-dark min-w-[140px]">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        <p className="font-mono text-xs text-primary mb-0.5">{batches} batches</p>
        <p className="font-mono text-xs text-destructive mb-0.5">{failed} failed</p>
        <p className="font-mono text-xs text-emerald-400">{rate}% success</p>
      </div>
    );
  }
  return null;
};

const DonutTooltip = ({ active, payload, total }: any) => {
  if (active && payload?.length) {
    const { name, value } = payload[0].payload;
    const pct = ((value / total) * 100).toFixed(1);
    return (
      <div className="rounded-lg border border-border/60 bg-surface-2 p-3 shadow-card-dark">
        <p className="text-xs text-muted-foreground mb-1">{name}</p>
        <p className="font-mono text-sm font-semibold text-foreground">{value.toLocaleString()}</p>
        <p className="font-mono text-xs text-muted-foreground">{pct}%</p>
      </div>
    );
  }
  return null;
};

// ── Custom range data builder ─────────────────────────────────────────────────
const buildCustomData = (from: Date, to: Date) => {
  const result: { day: string; batches: number; sats: number }[] = [];
  const cur = new Date(from);
  // Cap at 365 days
  const maxTo = addDays(from, 365);
  const effectiveTo = to > maxTo ? maxTo : to;
  while (cur <= effectiveTo) {
    const seed = cur.getDate() + cur.getMonth() * 31;
    const batches = 18 + (seed * 7) % 55;
    result.push({
      day: format(cur, "MMM d"),
      batches,
      sats: batches * 195_000,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
};

const RANGES: { label: string; value: Exclude<Range, "custom"> }[] = [
  { label: "7d",  value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

type Recipient = typeof topRecipients[number];

const SortableHeader = ({
  label,
  sortKey: key,
  activeSortKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) => {
  const isActive = activeSortKey === key;
  return (
    <th
      onClick={() => onSort(key)}
      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer select-none group transition-colors text-muted-foreground hover:text-foreground"
    >
      <div className="inline-flex items-center gap-1.5">
        {label}
        <span className={isActive ? "text-primary" : "text-muted-foreground/30 group-hover:text-muted-foreground/60"}>
          {isActive && sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </span>
      </div>
    </th>
  );
};

const RecipientHoverCard = ({ recipient: r }: { recipient: Recipient }) => (
  <HoverCard openDelay={200} closeDelay={100}>
    <HoverCardTrigger asChild>
      <span className="font-mono text-sm text-foreground cursor-default underline decoration-dotted decoration-muted-foreground/40 underline-offset-2">
        {r.address.slice(0, 12)}...{r.address.slice(-6)}
      </span>
    </HoverCardTrigger>
    <HoverCardContent side="right" align="start" className="w-72 border-border/60 bg-surface-2 p-4">
      <p className="font-mono text-xs text-foreground truncate mb-0.5">{r.address}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {r.received} payments · {r.totalSats.toLocaleString()} sats total
      </p>
      <p className="text-xs font-medium text-muted-foreground mb-2">Sats per batch</p>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={r.batchBreakdown} barGap={2} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="batch"
            tick={{ fill: "hsl(215 16% 55%)", fontSize: 9, fontFamily: "IBM Plex Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Bar dataKey="sats" fill="hsl(262 83% 58%)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </HoverCardContent>
  </HoverCard>
);

// ── Page ─────────────────────────────────────────────────────────────────────
export default function StatsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [addressFilter, setAddressFilter] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Page-level date range filter — synced with chart range toggle
  const { sharedDateRange: statsDateRange, setSharedDateRange: setStatsDateRange } = useDateRange();
  const [statsCalendarOpen, setStatsCalendarOpen] = useState(false);

  // Helper: compute actual date range from a preset
  const presetToDateRange = useCallback((preset: Exclude<Range, "custom">): DateRange => {
    const to = new Date();
    const days = preset === "7d" ? 7 : preset === "30d" ? 30 : 90;
    const from = addDays(to, -days);
    return { from, to };
  }, []);

  // When a preset range button is clicked in the bar chart
  const handlePresetRange = useCallback((preset: Exclude<Range, "custom">) => {
    setRange(preset);
    const dr = presetToDateRange(preset);
    setDateRange(undefined);
    setStatsDateRange(dr);
  }, [presetToDateRange, setStatsDateRange]);

  // When custom range is applied in the bar chart popover
  const handleApplyCustomRange = useCallback(() => {
    setPopoverOpen(false);
    if (dateRange?.from && dateRange?.to) {
      setStatsDateRange(dateRange);
    }
  }, [dateRange, setStatsDateRange]);

  // When page-level date picker changes
  const handlePageDateChange = useCallback((newRange: DateRange | undefined) => {
    setStatsDateRange(newRange);
    if (newRange?.from && newRange?.to) {
      setRange("custom");
      setDateRange(newRange);
    } else {
      // Cleared — reset to 7d
      setRange("7d");
      setDateRange(undefined);
    }
  }, [setStatsDateRange]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedRecipients = useMemo(() => {
    const filtered = addressFilter.trim()
      ? topRecipients.filter(r =>
          r.address.toLowerCase().includes(addressFilter.trim().toLowerCase())
        )
      : topRecipients;

    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "address")   cmp = a.address.localeCompare(b.address);
      if (sortKey === "received")  cmp = a.received - b.received;
      if (sortKey === "totalSats") cmp = a.totalSats - b.totalSats;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [sortKey, sortDir, addressFilter]);

  const handleExportCSV = () => {
    const header = "Rank,Address,Times Received,Total Sats";
    const rows = sortedRecipients.map(r =>
      `${r.rank},${r.address},${r.received},${r.totalSats}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "top-recipients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSummaryCSV = () => {
    const periodLabel = statsDateRangeLabel
      ?? { "7d": "Last 7 days", "30d": "Last 30 days", "90d": "Last 90 days", "custom": "Custom range" }[range];

    const csvRows: string[] = [];

    // Section 0: Header
    csvRows.push("BatchPay Analytics Export");
    csvRows.push(`Period,"${periodLabel}"`);
    csvRows.push(`Generated,${new Date().toISOString()}`);
    csvRows.push("");

    // Section 1: Batch status breakdown
    csvRows.push("BATCH STATUS BREAKDOWN");
    csvRows.push("Status,Count,Percentage");
    donutData.forEach(({ name, value }) => {
      const pct = ((value / donutTotal) * 100).toFixed(1);
      csvRows.push(`${name},${value},${pct}%`);
    });
    csvRows.push(`Total,${donutTotal},100%`);
    csvRows.push("");

    // Section 2: Daily activity
    csvRows.push("DAILY ACTIVITY");
    csvRows.push("Date,Batches,Failed Batches,Success Rate");
    lineData.forEach(({ day, batches, failedBatches }) => {
      const rate = batches > 0 ? (((batches - failedBatches) / batches) * 100).toFixed(1) : "0.0";
      csvRows.push(`${day},${batches},${failedBatches},${rate}%`);
    });
    csvRows.push("");

    // Section 3: Quick stats
    if (quickStats.length > 0) {
      csvRows.push("QUICK STATS");
      csvRows.push("Metric,Value");
      quickStats.forEach(({ label, value }) => csvRows.push(`"${label}","${value}"`));
      csvRows.push("");
    }

    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batchpay-stats-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCustom = range === "custom";
  const customData = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return buildCustomData(dateRange.from, dateRange.to);
    }
    return [];
  }, [dateRange?.from, dateRange?.to]);

  const chartData = isCustom && customData.length > 0
    ? customData
    : chartDataByRange[range as Exclude<Range, "custom">] ?? weeklyData;

  // Page-level date range label
  const statsDateRangeLabel = (() => {
    if (!statsDateRange?.from) return null;
    if (!statsDateRange.to) return format(statsDateRange.from, "MMM d");
    return `${format(statsDateRange.from, "MMM d")} – ${format(statsDateRange.to, "MMM d")}`;
  })();

  // Donut data scaled to the selected period
  const donutData = useMemo(() => {
    if (!statsDateRange?.from || !statsDateRange?.to) return batchStatusData;
    const periodData = buildCustomData(statsDateRange.from, statsDateRange.to);
    const periodBatches = periodData.reduce((s, d) => s + d.batches, 0);
    const scale = periodBatches / batchStatusTotal;
    return batchStatusData.map(d => ({
      ...d,
      value: Math.max(1, Math.round(d.value * scale)),
    }));
  }, [statsDateRange]);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // Line chart data filtered to the page-level date range when active
  const lineData = useMemo(() => {
    const base =
      statsDateRange?.from && statsDateRange?.to
        ? buildCustomData(statsDateRange.from, statsDateRange.to)
        : chartData;
    return base.map(d => ({ ...d, failedBatches: Math.round(d.batches * 0.018) }));
  }, [statsDateRange, chartData]);

  const hasCustomRange = isCustom && dateRange?.from && dateRange?.to;
  const rangeCapWarning = isCustom && dateRange?.from && dateRange?.to &&
    (dateRange.to.getTime() - dateRange.from.getTime()) > 365 * 24 * 60 * 60 * 1000;

  const chartSubtitle = isCustom
    ? (hasCustomRange
        ? `${format(dateRange!.from!, "MMM d")} – ${format(dateRange!.to!, "MMM d, yyyy")}`
        : "Select a date range to view custom data")
    : subtitleByRange[range as Exclude<Range, "custom">];

  const quickStatsTitle = isCustom ? "Custom Range" : quickStatsTitleByRange[range as Exclude<Range, "custom">];
  const quickStats = isCustom
    ? (customData.length > 0
        ? (() => {
            const totalBatches = customData.reduce((s, d) => s + d.batches, 0);
            const avgPerDay = Math.round(totalBatches / customData.length);
            const peak = customData.reduce((a, b) => b.batches > a.batches ? b : a, customData[0]);
            const totalSats = customData.reduce((s, d) => s + d.sats, 0);
            return [
              { label: "Total batches", value: totalBatches.toLocaleString() },
              { label: "Days in range", value: customData.length.toString() },
              { label: "Avg per day", value: `${avgPerDay} batches` },
              { label: "Peak day", value: `${peak.day} (${peak.batches})` },
              { label: "Total sats", value: `${(totalSats / 1_000_000).toFixed(1)}M` },
            ];
          })()
        : [])
    : quickStatsByRange[range as Exclude<Range, "custom">];

  const is30d = range === "30d" || (isCustom && customData.length > 14);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Protocol-wide statistics and performance metrics</p>
        </div>

        {/* Page-level date range filter */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-muted-foreground">Viewing:</span>
          <Popover open={statsCalendarOpen} onOpenChange={setStatsCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  statsDateRangeLabel
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 bg-surface-2 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <CalendarIcon className="h-3 w-3 shrink-0" />
                {statsDateRangeLabel ?? "All time"}
                {statsDateRangeLabel && (
                  <span
                    role="button"
                    aria-label="Clear date filter"
                    onClick={(e) => { e.stopPropagation(); handlePageDateChange(undefined); setStatsCalendarOpen(false); }}
                    className="ml-0.5 rounded-sm p-0.5 hover:bg-primary/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={statsDateRange}
                onSelect={(r) => setStatsDateRange(r)}
                disabled={{ after: new Date() }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
              <div className="flex justify-end px-4 pb-3 gap-2">
                {statsDateRange && (
                  <button
                    onClick={() => { handlePageDateChange(undefined); setStatsCalendarOpen(false); }}
                    className="rounded-md px-3 py-1.5 text-xs font-medium border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => {
                    if (statsDateRange?.from && statsDateRange?.to) {
                      handlePageDateChange(statsDateRange);
                    }
                    setStatsCalendarOpen(false);
                  }}
                  disabled={!statsDateRange?.from}
                  className="rounded-md px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                >
                  Apply
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSummaryCSV}
            className="ml-auto gap-1.5 text-xs h-8"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export Report
          </Button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={`rounded-xl border ${card.border} bg-surface-1 p-5 hover:bg-surface-2 transition-colors`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 border border-emerald/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    <ArrowUpRight className="h-3 w-3" />
                    {card.delta}
                  </span>
                </div>
                <div className="font-mono text-3xl font-bold text-foreground mb-1">{card.value}</div>
                <div className="text-sm text-muted-foreground">{card.label}</div>
              </div>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-5 gap-6 mb-8">

          {/* Bar chart */}
          <div className="lg:col-span-3 rounded-xl border border-border/50 bg-surface-1 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Daily Sats Sent</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{chartSubtitle}</p>
              </div>

              {/* Range toggle + legend */}
              <div className="flex flex-col items-end gap-2">
                {/* Range buttons */}
                <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-surface-2 p-0.5">
                  {RANGES.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => handlePresetRange(r.value)}
                      className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors ${
                        range === r.value
                          ? "bg-primary/20 border border-primary/40 text-primary"
                          : "text-muted-foreground hover:text-foreground border border-transparent"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}

                  {/* Custom button with popover */}
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        onClick={() => { setRange("custom"); setPopoverOpen(true); }}
                        className={`rounded-md px-2.5 py-1 font-mono text-xs transition-colors inline-flex items-center gap-1 ${
                          range === "custom"
                            ? "bg-primary/20 border border-primary/40 text-primary"
                            : "text-muted-foreground hover:text-foreground border border-transparent"
                        }`}
                      >
                        <CalendarIcon className="h-3 w-3" />
                        {hasCustomRange
                          ? `${format(dateRange!.from!, "MMM d")}–${format(dateRange!.to!, "MMM d")}`
                          : "Custom"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        disabled={{ after: new Date() }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                      {rangeCapWarning && (
                        <p className="px-4 pb-2 text-xs text-amber-400">Range capped at 365 days</p>
                      )}
                      <div className="flex justify-end px-4 pb-3">
                        <button
                          onClick={handleApplyCustomRange}
                          disabled={!dateRange?.from || !dateRange?.to}
                          className="rounded-md px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Legend swatches */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-[hsl(262_83%_58%)]" />
                    <span className="text-xs font-mono text-muted-foreground">Batches</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-sm bg-[hsl(38_92%_50%/0.5)]" />
                    <span className="text-xs font-mono text-muted-foreground">Sats</span>
                  </div>
                </div>
              </div>
            </div>

            {isCustom && !hasCustomRange ? (
              <div className="flex items-center justify-center h-[220px]">
                <p className="text-sm text-muted-foreground">Select a date range to view custom data</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={is30d ? 240 : 220}>
              <BarChart data={chartData} barGap={4} margin={is30d ? { bottom: 20 } : {}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 15%)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{
                    fill: "hsl(215 16% 55%)",
                    fontSize: 11,
                    fontFamily: "IBM Plex Mono",
                  }}
                  angle={is30d ? -45 : 0}
                  textAnchor={is30d ? "end" : "middle"}
                  interval={is30d ? 4 : 0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="batches"
                  tick={{ fill: "hsl(215 16% 55%)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={formatYAxis}
                />
                <YAxis
                  yAxisId="sats"
                  orientation="right"
                  tick={{ fill: "hsl(215 16% 55%)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={formatYAxis}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(262 83% 66% / 0.05)" }} />
                <Bar
                  yAxisId="batches"
                  dataKey="batches"
                  fill="hsl(262 83% 58%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  yAxisId="sats"
                  dataKey="sats"
                  fill="hsl(38 92% 50% / 0.3)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>

          {/* Quick stats */}
          <div className="lg:col-span-2 rounded-xl border border-border/50 bg-surface-1 p-6">
            <h2 className="text-sm font-semibold text-foreground mb-6">{quickStatsTitle}</h2>
            {isCustom && !hasCustomRange ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-xs text-muted-foreground text-center">Select a date range above<br />to view custom stats</p>
              </div>
            ) : (
              <div className="space-y-4">
                {quickStats.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{label}</span>
                    <span className="font-mono text-sm font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transaction Volume Over Time — Line Chart */}
        <div className="rounded-xl border border-border/50 bg-surface-1 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Transaction Volume Over Time</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {statsDateRangeLabel
                  ? `Total batches vs failed batches · ${statsDateRangeLabel}`
                  : "Total batches vs failed batches over the selected period"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                <span className="text-xs font-mono text-muted-foreground">Batches</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-0 w-6 border-t-2 border-dashed border-destructive" />
                <span className="text-xs font-mono text-muted-foreground">Failed</span>
              </div>
            </div>
          </div>

          {isCustom && !hasCustomRange ? (
            <div className="flex items-center justify-center h-[180px]">
              <p className="text-sm text-muted-foreground">Select a date range to view custom data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={is30d ? 220 : 180}>
              <LineChart data={lineData} margin={is30d ? { bottom: 20 } : {}}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 15%)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "hsl(215 16% 55%)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  angle={is30d ? -45 : 0}
                  textAnchor={is30d ? "end" : "middle"}
                  interval={is30d ? 4 : 0}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="batches"
                  tick={{ fill: "hsl(215 16% 55%)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={formatYAxis}
                />
                <YAxis
                  yAxisId="failed"
                  orientation="right"
                  tick={{ fill: "hsl(215 16% 55%)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<LineTooltip />} cursor={{ stroke: "hsl(215 25% 20%)", strokeWidth: 1 }} />
                <Line
                  yAxisId="batches"
                  type="monotone"
                  dataKey="batches"
                  stroke="hsl(262 83% 58%)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "hsl(262 83% 58%)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="failed"
                  type="monotone"
                  dataKey="failedBatches"
                  stroke="hsl(0 72% 51%)"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(0 72% 51%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bottom row: Donut chart + Top Recipients table */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Donut — Batch Status Breakdown */}
          <div className="lg:col-span-2 rounded-xl border border-border/50 bg-surface-1 p-6">
            <h2 className="text-sm font-semibold text-foreground mb-1">Batch Status Breakdown</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {statsDateRangeLabel ? `Period: ${statsDateRangeLabel}` : "All-time confirmed vs pending vs failed"}
            </p>

            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ cx, cy }) => (
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
                      <tspan x={cx} dy="-0.4em" fontSize="18" fontWeight="700" fill="hsl(210 40% 96%)">
                        {donutTotal.toLocaleString()}
                      </tspan>
                      <tspan x={cx} dy="1.4em" fontSize="10" fill="hsl(215 16% 55%)">
                        total
                      </tspan>
                    </text>
                  )}
                  labelLine={false}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<DonutTooltip total={donutTotal} />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-2 space-y-2">
              {donutData.map(({ name, value, color }) => {
                const pct = ((value / donutTotal) * 100).toFixed(1);
                return (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted-foreground">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-medium text-foreground">{value.toLocaleString()}</span>
                      <span className="font-mono text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Recipients Table */}
          <div className="lg:col-span-3 rounded-xl border border-border/50 bg-surface-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Top Recipients</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Most frequent recipients across all batches</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" />
                  <Input
                    value={addressFilter}
                    onChange={e => setAddressFilter(e.target.value)}
                    placeholder="Filter by address…"
                    className="h-8 pl-8 pr-8 text-xs w-44 bg-surface-2 border-border/60 focus-visible:ring-primary/60"
                  />
                  {addressFilter && (
                    <button
                      onClick={() => setAddressFilter("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={sortedRecipients.length === 0}
                  className="h-8 gap-1.5 text-xs border-border/60 hover:bg-surface-3"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                    <SortableHeader label="Address" sortKey="address" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Times Received" sortKey="received" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <SortableHeader label="Total Sats" sortKey="totalSats" activeSortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {sortedRecipients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No recipients match <span className="font-mono text-xs">"{addressFilter}"</span>
                      </td>
                    </tr>
                  )}
                  {sortedRecipients.map((r) => (
                    <tr key={r.rank} className="hover:bg-surface-2 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`font-mono text-sm font-bold ${r.rank === 1 ? "text-gold" : "text-muted-foreground/60"}`}>
                          {r.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <RecipientHoverCard recipient={r} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-foreground">{r.received}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {r.totalSats.toLocaleString()}
                          <span className="text-muted-foreground font-normal text-xs ml-1">sats</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
