import { useState, useEffect } from "react";

import { format, startOfDay, endOfDay } from "date-fns";
import { useDateRange } from "@/contexts/DateRangeContext";
import { NavBar } from "@/components/NavBar";
import { TransactionStatusBadge } from "@/components/batchpay/TransactionStatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, ExternalLink, Search, Users, Hash, Download, X, Copy, Check, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "confirmed" | "pending" | "failed";

interface BatchRecord {
  id: string;
  batchNum: number;
  status: "confirmed" | "pending" | "failed";
  recipients: number;
  totalSats: number;
  date: string;
  timeAgo: string;
  txId: string;
}

interface RecipientRow {
  address: string;
  amountSats: number;
  status: "confirmed" | "pending" | "failed";
}

// Deterministic seeded address/amount generator from txId characters
function generateRecipients(batch: BatchRecord): RecipientRow[] {
  const count = Math.min(batch.recipients, 200);
  const rows: RecipientRow[] = [];
  const chars = "ABCDEFGHJKMNPQRSTVWXYZ0123456789";
  const seed = batch.txId;

  // Distribute amounts with txId-seeded variance
  const baseAmount = Math.floor(batch.totalSats / batch.recipients);
  let remaining = batch.totalSats;

  for (let i = 0; i < count; i++) {
    // Use pairs of txId chars as seeds for address segments
    const offset = (i * 6) % (seed.length - 8);
    const seg1 = seed.slice(offset, offset + 8).toUpperCase().replace(/[^A-Z0-9]/g, "X");
    const seg2 = seed.slice(offset + 4, offset + 8).toUpperCase().replace(/[^A-Z0-9]/g, "Y");
    const addrBody = `${seg1}${chars[(seed.charCodeAt(offset) + i) % chars.length]}${seg2}`;
    const address = `SP${addrBody.slice(0, 6)}…${addrBody.slice(-4)}`;

    // Vary amounts within ±20% of base
    const variance = seed.charCodeAt(i % seed.length) % 40 - 20; // -20 to +19
    const isLast = i === count - 1;
    const amount = isLast
      ? Math.max(1000, remaining)
      : Math.max(1000, Math.floor(baseAmount * (1 + variance / 100)));
    remaining -= amount;

    // Status per batch status
    let status: RecipientRow["status"];
    if (batch.status === "confirmed") {
      status = "confirmed";
    } else if (batch.status === "pending") {
      status = "pending";
    } else {
      // failed: first 1–2 rows confirmed, rest failed
      status = i < Math.min(2, Math.floor(count * 0.15) + 1) ? "confirmed" : "failed";
    }

    rows.push({ address, amountSats: amount, status });
  }

  return rows;
}

const MOCK_HISTORY: BatchRecord[] = [
  { id: "1",  batchNum: 1247, status: "confirmed", recipients: 41,  totalSats: 4782000,  date: "Feb 20, 2026, 14:32", timeAgo: "2 hours ago",  txId: "3f9a8c2b4e7d1f6a9c3b5e8d2f4a7c1b9e3d6f2a8c5b7e4d1f9a3c6b8e2d5f7a" },
  { id: "2",  batchNum: 1246, status: "confirmed", recipients: 18,  totalSats: 1250000,  date: "Feb 20, 2026, 11:15", timeAgo: "5 hours ago",  txId: "7b4e1d9f2a6c8b3e5f7d2a4c9b6e1f3a8d5c2b7e4f1a9d3c6b8e2f5a7d4c1b9e" },
  { id: "3",  batchNum: 1245, status: "pending",   recipients: 75,  totalSats: 9800000,  date: "Feb 20, 2026, 08:01", timeAgo: "8 hours ago",  txId: "a2d5f8b1e4c7a9d3f6b2e5c8a1d4f7b3e6c9a2d5f8b1e4c7a9d3f6b2e5c8a1d4" },
  { id: "4",  batchNum: 1244, status: "failed",    recipients: 12,  totalSats: 650000,   date: "Feb 19, 2026, 16:45", timeAgo: "1 day ago",   txId: "c6b9e3f1a4d7c2b5e8f3a6d9c2b5e8f1a4d7c2b5e8f3a6d9c2b5e8f1a4d7c2b5" },
  { id: "5",  batchNum: 1243, status: "confirmed", recipients: 200, totalSats: 28500000, date: "Feb 19, 2026, 10:20", timeAgo: "1 day ago",   txId: "8e1b4f7a2c5d9e3b6f1a4c7d2e5b8f3a6c1d4e7b2f5a8c3d6e1b4f7a2c5d9e3b" },
  { id: "6",  batchNum: 1242, status: "confirmed", recipients: 33,  totalSats: 3200000,  date: "Feb 18, 2026, 22:10", timeAgo: "2 days ago",  txId: "d4a7c1b9e5f2a8d3c6b1e4f7a2d5c8b3e6f1a4d7c2b5e8f3a6d9c2b5e8f1a4d7" },
  { id: "7",  batchNum: 1241, status: "confirmed", recipients: 57,  totalSats: 6750000,  date: "Feb 17, 2026, 14:55", timeAgo: "3 days ago",  txId: "1f6a9c3b5e8d2f4a7c1b9e3d6f2a8c5b7e4d1f9a3c6b8e2d5f7a4c1b9e3d6f2a" },
  { id: "8",  batchNum: 1240, status: "failed",    recipients: 8,   totalSats: 420000,   date: "Feb 17, 2026, 09:33", timeAgo: "3 days ago",  txId: "5c8a1d4f7b3e6c9a2d5f8b1e4c7a9d3f6b2e5c8a1d4f7b3e6c9a2d5f8b1e4c7a" },
  { id: "9",  batchNum: 1239, status: "confirmed", recipients: 91,  totalSats: 11200000, date: "Feb 16, 2026, 18:44", timeAgo: "4 days ago",  txId: "9d2b6f1a4e8c3b7f2a5d9e4b1f6a3c8d2b5f9e1a4c7d3b6f2a8e5c1b9d4f7a3c" },
  { id: "10", batchNum: 1238, status: "confirmed", recipients: 25,  totalSats: 2100000,  date: "Feb 15, 2026, 12:08", timeAgo: "5 days ago",  txId: "e7c4a9d2f5b8e1c6a3d7f2b5e8c1a4d9f3b6e2c7a5d1f8b4e9c3a6d2f7b1e5c8" },
  { id: "11", batchNum: 1237, status: "confirmed", recipients: 62,  totalSats: 7340000,  date: "Feb 14, 2026, 20:17", timeAgo: "6 days ago",  txId: "b3e6f2a9c5d1b8e4f7a2c6d9b3e6f2a9c5d1b8e4f7a2c6d9b3e6f2a9c5d1b8e4" },
  { id: "12", batchNum: 1236, status: "pending",   recipients: 140, totalSats: 18600000, date: "Feb 14, 2026, 08:55", timeAgo: "6 days ago",  txId: "4a8d1f6b3e9c2a7d4b8f1e5c3a9d2f7b4e1c6a3d8f2b5e9c1a4d7f3b6e2c8a5d" },
  { id: "13", batchNum: 1235, status: "confirmed", recipients: 29,  totalSats: 3050000,  date: "Feb 13, 2026, 15:30", timeAgo: "7 days ago",  txId: "6f2c8a5d1b9e4f7c3a6d2b8e5f1c9a3d6b2e8f5c1a9d3f6b2e8c5a1d4f7b3e6c" },
  { id: "14", batchNum: 1234, status: "failed",    recipients: 5,   totalSats: 210000,   date: "Feb 12, 2026, 11:42", timeAgo: "8 days ago",  txId: "2e5b8f4c1a7d3e6b9f2c5a8d1e4b7f3c6a2d5e8b1f4c7a3d6e2b9f5c1a4d8e3b" },
  { id: "15", batchNum: 1233, status: "confirmed", recipients: 88,  totalSats: 10450000, date: "Feb 11, 2026, 17:22", timeAgo: "9 days ago",  txId: "7a3d6c9b2e5f1a8d4c7b3e6f2a9d5c1b8e4f7a3d6c9b2e5f1a8d4c7b3e6f2a9d" },
  { id: "16", batchNum: 1232, status: "confirmed", recipients: 44,  totalSats: 5120000,  date: "Feb 10, 2026, 09:11", timeAgo: "10 days ago", txId: "c1b4e8f3a6d2c9b5e1f4a7d3c8b2e5f1a4d7c3b6e2f9a5d1c8b4e7f3a6d2c9b5" },
  { id: "17", batchNum: 1231, status: "confirmed", recipients: 16,  totalSats: 890000,   date: "Feb 09, 2026, 21:05", timeAgo: "11 days ago", txId: "8f5c2a9d6b1e4f8c3a7d2b6e9f4c1a5d8b3e7f2c6a1d4b9e5f3c8a2d6b1e4f7c" },
  { id: "18", batchNum: 1230, status: "pending",   recipients: 55,  totalSats: 6400000,  date: "Feb 08, 2026, 14:38", timeAgo: "12 days ago", txId: "3d7b1e5f9c2a6d4b8e1f5c3a7d2b9e6f1c4a8d3b7e2f6c1a5d9b4e8f2c7a3d6b" },
  { id: "19", batchNum: 1229, status: "confirmed", recipients: 103, totalSats: 13700000, date: "Feb 07, 2026, 10:50", timeAgo: "13 days ago", txId: "9e4c8a2d6f1b5e9c3a7d2f6b1e4c8a3d7f2b6e1c5a9d4f8b2e6c1a5d3f7b9e2c" },
  { id: "20", batchNum: 1228, status: "failed",    recipients: 22,  totalSats: 1180000,  date: "Feb 06, 2026, 16:14", timeAgo: "14 days ago", txId: "5b9e3f7c1a4d8b2e6f3c9a5d1b8e4f7c2a6d3b9e5f1c8a4d2b7e6f3c1a9d5b8e" },
];

const PAGE_SIZE = 8;

const filterTabs: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
];

const totalRecipients = MOCK_HISTORY.reduce((sum, b) => sum + b.recipients, 0);
const totalSats = MOCK_HISTORY.reduce((sum, b) => sum + b.totalSats, 0);
const totalSatsLabel = `${(totalSats / 1_000_000).toFixed(1)}M`;

export default function HistoryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [copied, setCopied] = useState(false);
  const { sharedDateRange: dateRange, setSharedDateRange: setDateRange } = useDateRange();
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => { setPage(1); }, [filter, search, dateRange]);

  const handleCopy = async (txId: string) => {
    await navigator.clipboard.writeText(txId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = MOCK_HISTORY.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      String(b.batchNum).includes(q) ||
      b.txId.toLowerCase().includes(q) ||
      generateRecipients(b).some((r) => r.address.toLowerCase().includes(q));

    let matchesDate = true;
    if (dateRange?.from) {
      const batchDate = new Date(b.date);
      const from = startOfDay(dateRange.from);
      const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
      matchesDate = batchDate >= from && batchDate <= to;
    }

    return matchesFilter && matchesSearch && matchesDate;
  });

  const dateRangeLabel = (() => {
    if (!dateRange?.from) return null;
    if (!dateRange.to) return format(dateRange.from, "MMM d");
    return `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`;
  })();

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExportCSV = () => {
    const header = "Date,Batch ID,Recipients,Total Sats,Status,TX ID";
    const rows = filtered.map(b =>
      `${b.date},${b.batchNum},${b.recipients},${b.totalSats},${b.status},${b.txId}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, null, totalPages];
    if (page >= totalPages - 2) return [1, null, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, null, page - 1, page, page + 1, null, totalPages];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Batch History</h1>
          <p className="text-sm text-muted-foreground mt-1">Track all your past and pending batch transactions</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Batches", value: MOCK_HISTORY.length.toString() },
            { label: "Total Recipients", value: totalRecipients.toLocaleString() },
            { label: "Total Sats", value: `${totalSatsLabel} sats` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/40 bg-surface-1 px-5 py-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="font-mono font-semibold text-foreground text-lg">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex rounded-lg border border-border/50 bg-surface-2 p-1 gap-0.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                  filter === tab.id
                    ? "bg-surface-1 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-3/50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:max-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batch #, TX ID, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-surface-2 border-border/50 text-sm"
            />
          </div>

          {/* Date range picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2 border-border/50 bg-surface-2 font-normal",
                  !dateRange?.from && "text-muted-foreground",
                  dateRange?.from && "text-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4 shrink-0" />
                {dateRangeLabel ?? "Date range"}
                {dateRange?.from && (
                  <span
                    role="button"
                    aria-label="Clear date range"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDateRange(undefined);
                      setCalendarOpen(false);
                    }}
                    className="ml-1 rounded-full hover:bg-muted p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                disabled={{ after: new Date() }}
                numberOfMonths={1}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Active-filter chip bar */}
        {(() => {
          const statusDotColor: Record<string, string> = {
            confirmed: "bg-emerald-400",
            pending: "bg-amber-400",
            failed: "bg-destructive",
          };
          const chips = [
            filter !== "all" && {
              label: filter.charAt(0).toUpperCase() + filter.slice(1),
              dotColor: statusDotColor[filter] ?? "bg-muted-foreground",
              onRemove: () => setFilter("all"),
            },
            search !== "" && {
              label: `Search: "${search}"`,
              dotColor: "bg-muted-foreground",
              onRemove: () => setSearch(""),
            },
            dateRange?.from && {
              label: dateRangeLabel ?? "Date",
              dotColor: "bg-muted-foreground",
              onRemove: () => setDateRange(undefined),
            },
          ].filter(Boolean) as { label: string; dotColor: string; onRemove: () => void }[];

          if (chips.length === 0) return null;
          return (
            <div className="flex flex-wrap items-center gap-2 mb-4 animate-fade-in">
              <span className="text-xs text-muted-foreground/60">Filters:</span>
              {chips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-surface-3/60 px-2.5 py-1 text-xs text-foreground"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${chip.dotColor} shrink-0`} />
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    aria-label={`Remove ${chip.label} filter`}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          );
        })()}

        {/* Results count + export */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-muted-foreground font-mono">
            {filtered.length} batch{filtered.length !== 1 ? "es" : ""} found
            {dateRangeLabel && <span className="ml-1.5 opacity-70">· {dateRangeLabel}</span>}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="h-7 gap-1.5 text-xs border-border/50 hover:bg-surface-3"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>

        {/* Batch table */}
        <div className="rounded-xl border border-border/40 bg-surface-1 overflow-hidden">
          {paginated.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No batches found</p>
              <p className="text-sm mt-1 opacity-70">Try adjusting your filters</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-surface-2/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide w-16">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Status</th>
                  <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Recip.</th>
                  <th className="hidden sm:table-cell text-right px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Total (sats)</th>
                  <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">TX ID</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((batch, i) => {
                  const explorerUrl = `https://explorer.hiro.so/txid/${batch.txId}?chain=mainnet`;
                  const statusBorder =
                    batch.status === "confirmed"
                      ? "border-l-emerald-500/60"
                      : batch.status === "pending"
                      ? "border-l-amber-400/60"
                      : "border-l-destructive/60";

                  return (
                    <tr
                      key={batch.id}
                      className={cn(
                        "border-l-2 border-b border-border/30 last:border-b-0 hover:bg-surface-2/60 transition-colors duration-150 animate-slide-up",
                        statusBorder
                      )}
                      style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                    >
                      {/* Batch # */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-muted-foreground">#{batch.batchNum}</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <TransactionStatusBadge status={batch.status} />
                          <span className="sm:hidden text-[10px] text-muted-foreground/60 mt-0.5">{batch.timeAgo}</span>
                        </div>
                      </td>

                      {/* Date (desktop) */}
                      <td className="hidden sm:table-cell px-4 py-3">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{batch.date}</span>
                      </td>

                      {/* Recipients */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-mono text-xs font-semibold text-foreground">{batch.recipients}</span>
                          <span className="sm:hidden font-mono text-[10px] text-muted-foreground">{batch.totalSats.toLocaleString()} sats</span>
                        </div>
                      </td>

                      {/* Total sats (desktop) */}
                      <td className="hidden sm:table-cell px-4 py-3 text-right">
                        <span className="font-mono text-xs font-semibold text-foreground">{batch.totalSats.toLocaleString()}</span>
                      </td>

                      {/* TX ID (desktop) */}
                      <td className="hidden md:table-cell px-4 py-3">
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-muted-foreground/70 hover:text-primary transition-colors underline-offset-2 hover:underline"
                        >
                          {batch.txId.slice(0, 8)}…{batch.txId.slice(-6)}
                        </a>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => setSelectedBatch(batch)}
                          >
                            Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            onClick={() => window.open(explorerUrl, "_blank")}
                            aria-label="View on Explorer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Batch Detail Slide-Over Sheet */}
        {(() => {
          if (!selectedBatch) return null;
          const allRecipients = generateRecipients(selectedBatch);
          const confirmedCount = allRecipients.filter(r => r.status === "confirmed").length;
          const confirmedPct = allRecipients.length > 0
            ? Math.round((confirmedCount / allRecipients.length) * 100)
            : 0;
          const explorerUrl = `https://explorer.hiro.so/txid/${selectedBatch.txId}?chain=mainnet`;

          return (
            <Sheet open={!!selectedBatch} onOpenChange={(open) => { if (!open) setSelectedBatch(null); }}>
              <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
                {/* Header */}
                <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
                  <div className="flex items-start justify-between gap-3 pr-6">
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-lg font-bold text-foreground">
                        Batch #{selectedBatch.batchNum}
                      </SheetTitle>
                      <div className="flex items-center gap-2 mt-1.5">
                        <TransactionStatusBadge status={selectedBatch.status} />
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{selectedBatch.date}</span>
                      </div>
                    </div>
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline whitespace-nowrap mt-1 flex-shrink-0"
                    >
                      View on Explorer
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </SheetHeader>

                {/* Summary strip */}
                <div className="px-6 py-4 border-b border-border/30 space-y-3">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-medium text-foreground">{selectedBatch.recipients}</span> recipients
                    </span>
                    <span className="text-muted-foreground">
                      <span className="font-mono font-semibold text-foreground">{selectedBatch.totalSats.toLocaleString()}</span>
                      <span className="text-xs ml-1">sats</span>
                    </span>
                  </div>

                  {/* TX ID + copy */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground truncate flex-1">
                      TX: {selectedBatch.txId.slice(0, 12)}…{selectedBatch.txId.slice(-8)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 shrink-0"
                      onClick={() => handleCopy(selectedBatch.txId)}
                      aria-label="Copy TX ID"
                    >
                      {copied
                        ? <Check className="h-3.5 w-3.5 text-[hsl(var(--emerald))]" />
                        : <Copy className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <Progress value={confirmedPct} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{confirmedCount}</span> / {allRecipients.length} confirmed
                      <span className="ml-1.5 opacity-60">({confirmedPct}%)</span>
                    </p>
                  </div>
                </div>

                {/* Recipient list */}
                <ScrollArea className="flex-1 px-6">
                  <div className="py-4">
                    {/* Column headers */}
                    <div className="grid grid-cols-[1.5rem_1fr_auto_auto] gap-x-4 items-center mb-2">
                      <span className="text-xs font-medium text-muted-foreground/60">#</span>
                      <span className="text-xs font-medium text-muted-foreground/60">Address</span>
                      <span className="text-xs font-medium text-muted-foreground/60 text-right">Amount</span>
                      <span className="text-xs font-medium text-muted-foreground/60">Status</span>
                    </div>
                    <div className="border-t border-border/20 mb-3" />
                    <div className="grid grid-cols-[1.5rem_1fr_auto_auto] gap-x-4 gap-y-3 items-center">
                      {allRecipients.map((row, idx) => (
                        <>
                          <span key={`n-${idx}`} className="text-xs text-muted-foreground/50 font-mono">{idx + 1}</span>
                          <span key={`a-${idx}`} className="font-mono text-xs text-foreground truncate">{row.address}</span>
                          <span key={`m-${idx}`} className="font-mono text-xs text-foreground text-right whitespace-nowrap">
                            {row.amountSats.toLocaleString()}
                            <span className="text-muted-foreground font-normal text-[10px] ml-0.5">sats</span>
                          </span>
                          <span key={`s-${idx}`}>
                            <TransactionStatusBadge status={row.status} />
                          </span>
                        </>
                      ))}
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer */}
                <SheetFooter className="px-6 py-4 border-t border-border/30 flex flex-row gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      const resendRecipients = allRecipients.map(r => ({
                        address: r.address,
                        amount: String(r.amountSats),
                        unit: "sats",
                      }));
                      sessionStorage.setItem("batchpay_resend", JSON.stringify(resendRecipients));
                      setSelectedBatch(null);
                      navigate("/app");
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Re-send Batch
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setSelectedBatch(null)}
                  >
                    Close
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          );
        })()}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={cn("cursor-pointer", page === 1 && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>

                {getPageNumbers().map((num, idx) =>
                  num === null ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={num}>
                      <PaginationLink
                        isActive={page === num}
                        onClick={() => setPage(num)}
                        className="cursor-pointer"
                      >
                        {num}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className={cn("cursor-pointer", page === totalPages && "pointer-events-none opacity-50")}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
}
