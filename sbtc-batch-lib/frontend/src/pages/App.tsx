import { useState, useCallback, useEffect, useRef } from "react";
import { NavBar } from "@/components/NavBar";
import { useWallet } from "@/contexts/WalletContext";
import { BatchSummaryCard } from "@/components/batchpay/BatchSummaryCard";
import { AddressInput } from "@/components/batchpay/AddressInput";
import { AmountInput } from "@/components/batchpay/AmountInput";
import { RecipientCard, type Recipient } from "@/components/batchpay/RecipientCard";
import { ValidationSummary } from "@/components/batchpay/ValidationSummary";
import { CSVInput } from "@/components/batchpay/CSVInput";
import { ConfirmBatchModal } from "@/components/batchpay/ConfirmBatchModal";
import { OverwriteConfirmModal } from "@/components/batchpay/OverwriteConfirmModal";
import { TransactionProgressModal, type RecipientForTx } from "@/components/batchpay/TransactionProgressModal";
import { SaveTemplateModal } from "@/components/batchpay/SaveTemplateModal";
import { useContract } from "@/hooks/useContract";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserPlus, ChevronLeft, ChevronRight, ChevronUp, Eye, Zap, FileText, PenLine, LayoutTemplate, Users, Building2, ArrowRight, Bookmark, BookmarkCheck, Trash2, AlertTriangle, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BatchTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  recipients: Omit<Recipient, "id" | "status">[];
}

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  recipients: Omit<Recipient, "id" | "status">[];
}

const BATCH_TEMPLATES: BatchTemplate[] = [
  {
    id: "payroll",
    name: "Monthly Payroll",
    description: "Disburse monthly salaries to your team",
    icon: Users,
    color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    recipients: [
      { address: "ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ", amount: "1200000", unit: "sats" },
      { address: "ST3GWX3NE58KJET25ZZ6D193D4D3EMXT5E8KXNJV", amount: "950000",  unit: "sats" },
      { address: "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8K", amount: "800000",  unit: "sats" },
      { address: "ST2QXJDSWYFGT9022M5TEZZNKQGVYCNH5D2GQBPH", amount: "750000",  unit: "sats" },
      { address: "ST3NFTHTNKNJRFB4NPRQVSRD6THVSZ8YZ36VBPM1", amount: "600000",  unit: "sats" },
      { address: "ST1MXSZF4NFC9JQ55NZXHME0PC3FKXB28MX6ZKG2", amount: "500000",  unit: "sats" },
    ],
  },
  {
    id: "airdrop",
    name: "Community Airdrop",
    description: "Equal distribution to community wallet holders",
    icon: Zap,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    recipients: [
      { address: "ST1WN90HKT0E1FWCJT9JFPMC8YP7XGHA0GBW16BX", amount: "100000", unit: "sats" },
      { address: "ST2MN84Y4VP9N7H64ZDVQE5KVX4XRJB8BQBVBXJK", amount: "100000", unit: "sats" },
      { address: "ST3KDQZP3NTKZAKJ1NRQHX0FJCQ46YQQZQJX9MRT", amount: "100000", unit: "sats" },
      { address: "ST1P72Z3704VMT3DMHPP2CB8TAAT8GZSBF5RA2R0", amount: "100000", unit: "sats" },
      { address: "ST2C2YFP12AJZB4MABJBAJ85B6DCF7NPHQJD3GZ3", amount: "100000", unit: "sats" },
      { address: "ST3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5XQ2", amount: "100000", unit: "sats" },
      { address: "ST1Y5YSTAHZ88XYK1VPDH24GY0HPX5J4JECTMY4A", amount: "100000", unit: "sats" },
      { address: "ST2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9", amount: "100000", unit: "sats" },
    ],
  },
  {
    id: "treasury",
    name: "Treasury Allocation",
    description: "Distribute funds across treasury sub-wallets",
    icon: Building2,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    recipients: [
      { address: "ST3D03GMKH86AXJCZJHFNX5C8ZX9KQJR2YPAHQZE", amount: "5000000", unit: "sats" },
      { address: "ST1QK1AZ24R132C0D84243RP9K1R7FEAP1FQZFB5G", amount: "3000000", unit: "sats" },
      { address: "ST2VCQJGH7PHP2DJK7Z0V48AGBHQAW3R3ZW1QQ97", amount: "1500000", unit: "sats" },
      { address: "ST3J3RJTX9TFNVTT7GZP6R73WPBSDN9BNZM3YV5F", amount: "500000",  unit: "sats" },
    ],
  },
];

function validateAddress(addr: string): boolean {
  // Accept testnet (ST, SN), mainnet (SP, SM), and Bitcoin addresses
  return /^(1|3|bc1|BC1|SP|SM|ST|SN)[a-zA-HJ-NP-Z0-9]{8,}$/.test(addr.trim());
}

const PAGE_SIZE = 25;

// Sample data for demo (testnet addresses)
const DEMO_RECIPIENTS: Recipient[] = [
  { id: "1", address: "ST2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ", amount: "500000", unit: "sats", status: "valid" },
  { id: "2", address: "ST3GWX3NE58KJET25ZZ6D193D4D3EMXT5E8KXNJV", amount: "250000", unit: "sats", status: "valid" },
  { id: "3", address: "ST1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8K", amount: "750000", unit: "sats", status: "valid" },
];

export default function AppPage() {
  const { stxAddress, connectWallet, isConnecting } = useWallet();
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<"sats" | "sBTC" | "BTC">("sats");
  const resendLoadedRef = useRef(false);
  const [recipients, setRecipients] = useState<Recipient[]>(() => {
    try {
      const stored = sessionStorage.getItem("batchpay_resend");
      if (!stored) return DEMO_RECIPIENTS;
      sessionStorage.removeItem("batchpay_resend");
      const parsed = JSON.parse(stored) as { address: string; amount: string; unit: string }[];
      resendLoadedRef.current = true;
      return parsed.map(r => ({
        id: crypto.randomUUID(),
        address: r.address,
        amount: r.amount,
        unit: r.unit as "sats" | "sBTC" | "BTC",
        status: "valid" as const,
      }));
    } catch { return DEMO_RECIPIENTS; }
  });
  const [shake, setShake] = useState(false);
  const [page, setPage] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [csvResetKey, setCsvResetKey] = useState(0);
  const [activeTab, setActiveTab] = useState("manual");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [overwriteModalOpen, setOverwriteModalOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<{ name: string; recipients: Omit<Recipient, "id" | "status">[] } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("batchpay_custom_templates") ?? "[]");
    } catch { return []; }
  });

  // Fire toast once on mount if recipients were loaded from a re-send
  useEffect(() => {
    if (resendLoadedRef.current) {
      resendLoadedRef.current = false;
      toast.success("Batch loaded — review and execute", {
        description: `${recipients.length} recipients pre-filled from your history.`,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SATS_PER_BTC = 100_000_000;
  const totalSats = recipients.reduce((acc, r) => {
    const n = parseFloat(r.amount) || 0;
    if (r.unit === "sats") return acc + n;
    if (r.unit === "BTC" || r.unit === "sBTC") return acc + n * SATS_PER_BTC;
    return acc;
  }, 0);

  // Handle wallet connection with testnet validation
  const handleConnect = useCallback(async () => {
    try {
      await connectWallet();
      toast.success("Wallet connected", {
        description: "Connected to Stacks Testnet"
      });
    } catch (error: any) {
      const message = error?.message || '';
      if (message.includes('testnet') || message.includes('switch')) {
        toast.error("Testnet Required", {
          description: "Please switch your wallet to Testnet mode and try again.",
          duration: 6000,
        });
      } else if (!message.includes('cancel') && !message.includes('Cancel')) {
        toast.error("Connection failed", {
          description: message || "Please try again"
        });
      }
    }
  }, [connectWallet]);

  // Contract integration for real batch execution
  const contract = useContract();

  // Convert recipients to format needed for contract execution
  const getRecipientsForTx = useCallback((): RecipientForTx[] => {
    return recipients
      .filter(r => r.status === "valid")
      .map(r => {
        const n = parseFloat(r.amount) || 0;
        let amountInSats: number;
        if (r.unit === "sats") {
          amountInSats = Math.floor(n);
        } else {
          // BTC or sBTC -> convert to sats
          amountInSats = Math.floor(n * SATS_PER_BTC);
        }
        return {
          address: r.address,
          amount: amountInSats,
        };
      });
  }, [recipients]);

  // Execute batch transfer via the smart contract
  const handleExecuteBatch = useCallback(async (recs: RecipientForTx[]): Promise<{ txId: string; success: boolean }> => {
    const result = await contract.executeBatch(recs, true); // true = use mock tokens for testnet
    return result;
  }, [contract]);

  const totalPages = Math.ceil(recipients.length / PAGE_SIZE);
  const visibleRecipients = recipients.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const addRecipient = useCallback(() => {
    if (!address || !validateAddress(address)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (!amount || parseFloat(amount) <= 0) return;

    const isDuplicate = recipients.some((r) => r.address === address);
    const newRecipient: Recipient = {
      id: crypto.randomUUID(),
      address,
      amount,
      unit,
      status: isDuplicate ? "duplicate" : "valid",
    };

    setRecipients((prev) => [...prev, newRecipient]);
    setAddress("");
    setAmount("");
  }, [address, amount, unit, recipients]);

  const deleteRecipient = useCallback((id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const editRecipient = useCallback((id: string) => {
    const r = recipients.find((rec) => rec.id === id);
    if (r) {
      setAddress(r.address);
      setAmount(r.amount);
      setUnit(r.unit);
      setRecipients((prev) => prev.filter((rec) => rec.id !== id));
    }
  }, [recipients]);

  const handleCSVImport = useCallback((rows: { address: string; amount: string }[]) => {
    const addresses = new Set(recipients.map((r) => r.address));
    const newRecipients: Recipient[] = rows.map((row) => ({
      id: crypto.randomUUID(),
      address: row.address,
      amount: row.amount,
      unit: "sats" as const,
      status: addresses.has(row.address) ? "duplicate" : "valid",
    }));
    setRecipients((prev) => [...prev, ...newRecipients]);
  }, [recipients]);

  const loadRecipients = useCallback((template: { name: string; recipients: Omit<Recipient, "id" | "status">[] }) => {
    if (recipients.length > 0) {
      setPendingTemplate(template);
      setOverwriteModalOpen(true);
    } else {
      const newRecipients: Recipient[] = template.recipients.map((r) => ({
        ...r,
        id: crypto.randomUUID(),
        status: "valid" as const,
      }));
      setRecipients(newRecipients);
      setPage(0);
      setActiveTab("manual");
    }
  }, [recipients.length]);

  const handleOverwriteConfirm = useCallback(() => {
    if (!pendingTemplate) return;
    const newRecipients: Recipient[] = pendingTemplate.recipients.map((r) => ({
      ...r,
      id: crypto.randomUUID(),
      status: "valid" as const,
    }));
    setRecipients(newRecipients);
    setPage(0);
    setActiveTab("manual");
    setOverwriteModalOpen(false);
    setPendingTemplate(null);
  }, [pendingTemplate]);

  const handleOverwriteCancel = useCallback(() => {
    setOverwriteModalOpen(false);
    setPendingTemplate(null);
  }, []);

  const handleLoadTemplate = useCallback((template: BatchTemplate) => {
    loadRecipients(template);
  }, [loadRecipients]);

  const handleLoadCustomTemplate = useCallback((template: CustomTemplate) => {
    loadRecipients(template);
  }, [loadRecipients]);

  const handleSaveTemplate = useCallback((name: string, description: string) => {
    const newTemplate: CustomTemplate = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
      recipients: recipients.map(({ address, amount, unit }) => ({ address, amount, unit })),
    };
    const updated = [newTemplate, ...customTemplates];
    setCustomTemplates(updated);
    try { localStorage.setItem("batchpay_custom_templates", JSON.stringify(updated)); } catch { /* noop */ }
    setSaveModalOpen(false);
    toast.success("Template saved!", { description: `"${name}" is now available in the Templates tab.` });
  }, [recipients, customTemplates]);

  const handleDeleteCustomTemplate = useCallback((id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try { localStorage.setItem("batchpay_custom_templates", JSON.stringify(updated)); } catch { /* noop */ }
  }, [customTemplates]);

  const handleConfirm = () => {
    setConfirmOpen(false);
    setProgressOpen(true);
  };

  const handleProgressClose = () => {
    setProgressOpen(false);
    setRecipients([]);
    setCsvResetKey(k => k + 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Panel: Batch Summary — desktop only */}
          <div className="hidden lg:block lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
            <BatchSummaryCard recipients={recipients} />

            {/* Quick tips */}
            <div className="rounded-xl border border-border/40 bg-surface-1 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Tips</p>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  Use CSV Import for bulk uploads (50+ recipients)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  Max 200 recipients per batch
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  Duplicate addresses are flagged automatically
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Builder */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Input Tabs */}
            <div className="rounded-xl border border-border/50 bg-surface-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="px-5 pt-5 pb-0 border-b border-border/40">
                  <TabsList className="bg-surface-3/50 border border-border/40 h-9 p-1 gap-0.5 mb-5">
                    <TabsTrigger value="manual" className="gap-2 data-[state=active]:bg-surface-1 data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs">
                      <PenLine className="h-3.5 w-3.5" />
                      Manual Entry
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="gap-2 data-[state=active]:bg-surface-1 data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs">
                      <FileText className="h-3.5 w-3.5" />
                      CSV Import
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-2 data-[state=active]:bg-surface-1 data-[state=active]:text-primary data-[state=active]:shadow-sm text-xs">
                      <LayoutTemplate className="h-3.5 w-3.5" />
                      Templates
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Manual Entry */}
                <TabsContent value="manual" className="p-5 mt-0">
                  <div className="space-y-4">
                    <AddressInput
                      label="Recipient Address"
                      value={address}
                      onChange={setAddress}
                      shake={shake}
                    />
                    <AmountInput
                      label="Amount"
                      value={amount}
                      unit={unit}
                      onChange={setAmount}
                      onUnitChange={setUnit}
                      maxBalance={1000000}
                    />
                    {recipients.length >= 190 && recipients.length < 200 && (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        Approaching limit: {recipients.length}/200 recipients
                      </div>
                    )}
                    {recipients.length >= 200 && (
                      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                        Recipient limit reached (200 max). Remove entries to add more.
                      </div>
                    )}
                    <Button
                      onClick={addRecipient}
                      className="w-full gap-2 bg-primary hover:bg-primary/90 font-semibold"
                      disabled={!address || !amount || recipients.length >= 200}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Recipient
                    </Button>
                  </div>
                </TabsContent>

                {/* CSV Import */}
                <TabsContent value="csv" className="p-5 mt-0">
                  <CSVInput key={csvResetKey} onImport={handleCSVImport} />
                </TabsContent>

                {/* Templates */}
                <TabsContent value="templates" className="p-5 mt-0">
                  {/* Built-in Templates section */}
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Built-in Templates</p>
                  <div className="space-y-3">
                    {BATCH_TEMPLATES.map((template) => {
                      const Icon = template.icon;
                      const totalSats = template.recipients.reduce((acc, r) => acc + parseFloat(r.amount), 0);
                      return (
                        <div
                          key={template.id}
                          className="flex items-center gap-4 rounded-xl border border-border/40 bg-surface-2 p-4 hover:border-border/70 hover:bg-surface-3 transition-all duration-200"
                        >
                          <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg border flex items-center justify-center", template.color)}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold text-foreground">{template.name}</span>
                              <span className="rounded-full bg-surface-4 px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                                {template.recipients.length} recipients
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{template.description}</p>
                            <p className="text-xs font-mono text-muted-foreground mt-1">
                              {totalSats.toLocaleString()} sats total
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-shrink-0 gap-1.5 border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                            onClick={() => handleLoadTemplate(template)}
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                            Use Template
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Your Templates section */}
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mt-6 mb-3">Your Templates</p>
                  {customTemplates.length === 0 ? (
                    <div className="rounded-xl border border-border/30 bg-surface-2/50 p-6 text-center">
                      <BookmarkCheck className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground/70">No saved templates yet.</p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5">Build a recipient list and click "Save as Template".</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customTemplates.map((template) => {
                        const totalSats = template.recipients.reduce((acc, r) => acc + parseFloat(r.amount), 0);
                        const date = new Date(template.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                        return (
                          <div
                            key={template.id}
                            className="flex items-center gap-4 rounded-xl border border-border/40 bg-surface-2 p-4 hover:border-border/70 hover:bg-surface-3 transition-all duration-200"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg border border-sky-500/20 bg-sky-500/10 flex items-center justify-center">
                              <BookmarkCheck className="h-5 w-5 text-sky-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-foreground">{template.name}</span>
                                <span className="rounded-full bg-surface-4 px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                                  {template.recipients.length} recipients
                                </span>
                              </div>
                              {template.description && (
                                <p className="text-xs text-muted-foreground">{template.description}</p>
                              )}
                              <p className="text-xs font-mono text-muted-foreground mt-1">
                                {totalSats.toLocaleString()} sats total · {date}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 border-border/60 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                                onClick={() => handleLoadCustomTemplate(template)}
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                                Use
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteCustomTemplate(template.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-center text-xs text-muted-foreground mt-4 opacity-60">
                    Templates pre-fill the recipient list — you can edit, add, or remove entries freely
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            {/* Recipients List — always rendered */}
            <div className="rounded-xl border border-border/50 bg-surface-1 overflow-hidden">
              {recipients.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="relative mb-6">
                    {/* Violet glow ring behind illustration */}
                    <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl scale-150" />
                    <svg
                      width="120"
                      height="100"
                      viewBox="0 0 120 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="relative"
                      aria-hidden="true"
                    >
                      {/* Tray body */}
                      <rect x="10" y="48" width="100" height="44" rx="8" fill="hsl(216 31% 11%)" stroke="hsl(215 25% 15%)" strokeWidth="1.5" />
                      {/* Tray inner shadow line */}
                      <rect x="18" y="56" width="84" height="1.5" rx="0.75" fill="hsl(215 25% 18%)" />
                      {/* Address placeholder line 1 */}
                      <rect x="18" y="64" width="52" height="5" rx="2.5" fill="hsl(215 28% 20%)" />
                      <rect x="76" y="64" width="26" height="5" rx="2.5" fill="hsl(262 83% 66% / 0.25)" />
                      {/* Address placeholder line 2 */}
                      <rect x="18" y="76" width="40" height="5" rx="2.5" fill="hsl(215 28% 20%)" />
                      <rect x="64" y="76" width="38" height="5" rx="2.5" fill="hsl(215 28% 20%)" />
                      {/* Tray rim / opening arc */}
                      <path d="M10 52 Q60 34 110 52" stroke="hsl(215 25% 15%)" strokeWidth="1.5" fill="none" />
                      {/* sBTC coin dropping */}
                      <circle cx="60" cy="28" r="16" fill="hsl(38 92% 50% / 0.15)" stroke="hsl(38 92% 50%)" strokeWidth="1.5" />
                      <circle cx="60" cy="28" r="11" fill="hsl(38 92% 50% / 0.2)" />
                      {/* sBTC S symbol */}
                      <text x="60" y="33" textAnchor="middle" fontSize="13" fontWeight="700" fill="hsl(38 92% 50%)" fontFamily="monospace">₿</text>
                      {/* Motion dots (coin dropping effect) */}
                      <circle cx="60" cy="8" r="2" fill="hsl(38 92% 50% / 0.4)" />
                      <circle cx="60" cy="1" r="1.2" fill="hsl(38 92% 50% / 0.2)" />
                      {/* Emerald valid dots on the right of lines */}
                      <circle cx="110" cy="66.5" r="2.5" fill="hsl(160 84% 55% / 0)" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">No recipients yet</h3>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-5">
                    Add addresses manually, import a CSV, or load a template to get started.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60"
                    onClick={() => setActiveTab("manual")}
                  >
                    Add your first recipient →
                  </Button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                    <h3 className="text-sm font-semibold text-foreground">
                      Recipients
                      <span className="ml-2 rounded-full bg-surface-3 px-2 py-0.5 text-xs text-muted-foreground font-mono">
                        {recipients.length}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2">
                      {recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm(`This will remove all ${recipients.length} recipients. Continue?`)) {
                              setRecipients([]);
                              setPage(0);
                            }
                          }}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Clear All
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => setSaveModalOpen(true)}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        Save as Template
                      </Button>
                      <ValidationSummary recipients={recipients} />
                    </div>
                  </div>

                  {/* List */}
                  <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {visibleRecipients.map((r, i) => (
                      <RecipientCard
                        key={r.id}
                        recipient={r}
                        index={page * PAGE_SIZE + i}
                        onDelete={deleteRecipient}
                        onEdit={editRecipient}
                        animationDelay={i * 50}
                      />
                    ))}
                  </div>

                </>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ── Fixed footer bar ── */}
      {(() => {
        const validCount = recipients.filter((r) => r.status === "valid").length;
        return (
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/50 bg-background/95 backdrop-blur-md">
            {/* Mobile: pagination row on top, buttons row below */}
            {/* Desktop: single row with three flex zones */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row items-center gap-2 lg:gap-0">

              {/* Mobile pagination row — only shown when totalPages > 1 */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2 lg:hidden order-first">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-mono text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={page === totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Button row — always shown */}
              <div className="w-full flex items-center justify-between lg:contents gap-3">

                {/* Left zone: Preview Batch */}
                <div className="flex-1 flex justify-start">
                  <Button
                    variant="outline"
                    className="gap-2 border-border/60 hover:bg-surface-2"
                    onClick={() => setConfirmOpen(true)}
                    disabled={validCount === 0}
                  >
                    <Eye className="h-4 w-4" />
                    Preview Batch
                  </Button>
                </div>

                {/* Center zone: Pagination (desktop only) */}
                <div className="hidden lg:flex flex-1 items-center justify-center gap-2">
                  {totalPages > 1 ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={page === 0}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-mono text-xs text-muted-foreground">
                        Page {page + 1} of {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={page === totalPages - 1}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : recipients.length > 0 ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
                    </span>
                  ) : null}
                </div>

                {/* Right zone: Execute Batch or Connect Wallet */}
                <div className="flex-1 flex justify-end">
                  {!stxAddress ? (
                    <Button
                      className="gap-2 bg-primary hover:bg-primary/90 font-semibold"
                      onClick={handleConnect}
                      disabled={isConnecting}
                    >
                      <Zap className="h-4 w-4" />
                      {isConnecting ? "Connecting..." : "Connect Wallet to Continue"}
                    </Button>
                  ) : (
                    <Button
                      className="gap-2 bg-primary hover:bg-primary/90 font-semibold shadow-violet-glow hover:shadow-violet-glow"
                      onClick={() => setConfirmOpen(true)}
                      disabled={validCount === 0}
                    >
                      <Zap className="h-4 w-4" />
                      Execute Batch
                    </Button>
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}


      {/* Mobile floating batch summary pill — shown below lg, above the footer bar */}
      {recipients.length > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 z-20 flex justify-center lg:hidden">
          <button
            onClick={() => setMobileSummaryOpen(true)}
            className="flex items-center gap-3 rounded-full border border-border/50 bg-background/95 backdrop-blur-md px-5 py-2.5 shadow-lg hover:border-primary/40 transition-all duration-200"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow flex-shrink-0" />
            <span className="font-mono text-sm font-medium text-foreground">
              {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono text-sm text-muted-foreground">
              {totalSats.toLocaleString()} sats
            </span>
            <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
          </button>
        </div>
      )}

      {/* Mobile Batch Summary Sheet */}
      <Sheet open={mobileSummaryOpen} onOpenChange={setMobileSummaryOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto bg-surface-1 border-border/50">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">Batch Summary</SheetTitle>
          </SheetHeader>
          <BatchSummaryCard recipients={recipients} className="border-0 shadow-none bg-transparent" />
          <div className="rounded-xl border border-border/40 bg-surface-2 p-4 mt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Tips</p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Use CSV Import for bulk uploads (50+ recipients)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Max 200 recipients per batch
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Duplicate addresses are flagged automatically
              </li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <ConfirmBatchModal
        isOpen={confirmOpen}
        recipients={recipients}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
      <TransactionProgressModal
        isOpen={progressOpen}
        onClose={handleProgressClose}
        recipients={getRecipientsForTx()}
        onExecute={handleExecuteBatch}
        useMockTokens={true}
      />
      <SaveTemplateModal
        isOpen={saveModalOpen}
        recipientCount={recipients.length}
        onSave={handleSaveTemplate}
        onCancel={() => setSaveModalOpen(false)}
      />
      <OverwriteConfirmModal
        isOpen={overwriteModalOpen}
        templateName={pendingTemplate?.name ?? ""}
        currentCount={recipients.length}
        incomingCount={pendingTemplate?.recipients.length ?? 0}
        onConfirm={handleOverwriteConfirm}
        onCancel={handleOverwriteCancel}
      />
    </div>
  );
}
