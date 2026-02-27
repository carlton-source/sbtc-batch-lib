import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Shield, Radio, Zap, ExternalLink, X, Copy, Check, AlertCircle, RefreshCw } from "lucide-react";
import { getExplorerUrl } from "@/lib/contract";

type Step = "validate" | "sign" | "broadcast" | "done";
type TransactionStatus = "pending" | "success" | "error";

const steps: { id: Step; label: string; sublabel: string; icon: React.ElementType }[] = [
  { id: "validate", label: "Validate", sublabel: "Checking recipients...", icon: Shield },
  { id: "sign", label: "Sign", sublabel: "Awaiting wallet signature...", icon: Zap },
  { id: "broadcast", label: "Broadcast", sublabel: "Broadcasting to network...", icon: Radio },
  { id: "done", label: "Done", sublabel: "Transaction confirmed!", icon: CheckCircle2 },
];

export interface RecipientForTx {
  address: string;
  amount: number;
}

interface TransactionProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients?: RecipientForTx[];
  onExecute?: (recipients: RecipientForTx[]) => Promise<{ txId: string; success: boolean }>;
  useMockTokens?: boolean;
}

export function TransactionProgressModal({ 
  isOpen, 
  onClose, 
  recipients = [],
  onExecute,
  useMockTokens = true,
}: TransactionProgressModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<TransactionStatus>("pending");
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (txId) {
      navigator.clipboard.writeText(txId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  function fireConfetti() {
    const brandViolet = "#7C3AED";
    const brandGold   = "#F59E0B";
    const emerald     = "#34D399";

    const shared = {
      particleCount: 60,
      spread: 55,
      startVelocity: 45,
      gravity: 0.9,
      ticks: 200,
      colors: [brandViolet, brandGold, emerald, "#fff"],
      zIndex: 9999,
    };

    confetti({ ...shared, origin: { x: 0.25, y: 0.65 }, angle: 60 });
    confetti({ ...shared, origin: { x: 0.75, y: 0.65 }, angle: 120 });
  }

  const executeTransaction = useCallback(async () => {
    if (!onExecute || recipients.length === 0) {
      // Fallback to mock behavior if no execute function provided
      const timers: ReturnType<typeof setTimeout>[] = [];
      timers.push(setTimeout(() => setCurrentStep(1), 1200));
      timers.push(setTimeout(() => setCurrentStep(2), 2800));
      timers.push(setTimeout(() => setCurrentStep(3), 4500));
      timers.push(setTimeout(() => { 
        setStatus("success"); 
        setTxId("0x" + Math.random().toString(16).slice(2, 18) + "...");
        fireConfetti(); 
      }, 5500));
      return () => timers.forEach(clearTimeout);
    }

    try {
      // Step 1: Validate
      setCurrentStep(0);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Sign (wallet popup will appear here)
      setCurrentStep(1);
      
      // Execute the transaction - this will trigger wallet popup
      const result = await onExecute(recipients);
      
      // Step 3: Broadcast
      setCurrentStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Done
      setCurrentStep(3);
      setTxId(result.txId);
      setStatus("success");
      fireConfetti();
      
    } catch (err: any) {
      console.error("Transaction error:", err);
      setError(err?.message || "Transaction failed or was cancelled");
      setStatus("error");
    }
  }, [onExecute, recipients]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setCurrentStep(0);
      setStatus("pending");
      setTxId(null);
      setError(null);
      return;
    }

    // Start transaction execution
    executeTransaction();
  }, [isOpen, executeTransaction]);

  const handleRetry = () => {
    setCurrentStep(0);
    setStatus("pending");
    setError(null);
    setTxId(null);
    executeTransaction();
  };

  if (!isOpen) return null;

  const isDone = status === "success";
  const isError = status === "error";
  const currentStepIndex = currentStep;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md animate-fade-in" />



      <div className="relative w-full max-w-sm animate-scale-in rounded-2xl border border-border/50 bg-surface-1 shadow-card-dark overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-primary/0 via-primary to-gold/50" />

        <div className="p-6">
          {isError ? (
            /* Error state */
            <div className="text-center">
              <div className="flex justify-end mb-2">
                <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-center mb-4">
                <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-1 text-foreground">Transaction Failed</h2>
              <p className="text-muted-foreground text-sm mb-5">{error || "Something went wrong"}</p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-border/60 hover:bg-surface-3"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 gap-2" 
                  onClick={handleRetry}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : isDone ? (
            /* Success state */
            <div className="text-center">
              <div className="flex justify-end mb-2">
                <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Animated draw-on SVG checkmark */}
              <div className="flex justify-center mb-4">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full animate-ping bg-emerald-400/10" />
                  <svg viewBox="0 0 52 52" fill="none" className="h-16 w-16 relative z-10">
                    <circle
                      cx="26"
                      cy="26"
                      r="24"
                      stroke="hsl(160 84% 39% / 0.3)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="26"
                      cy="26"
                      r="24"
                      stroke="hsl(160 84% 55%)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="150.8"
                      strokeDashoffset="150.8"
                      className="animate-draw-ring"
                      style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
                    />
                    <polyline
                      points="14,27 22,35 38,17"
                      stroke="hsl(160 84% 55%)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="34"
                      strokeDashoffset="34"
                      className="animate-draw-check"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-1">
                <span className="shimmer-gold">Batch Sent!</span>
              </h2>
              <p className="text-muted-foreground text-sm mb-5">Your batch transaction was broadcast successfully</p>

              {/* TX ID */}
              {txId && (
                <div className="rounded-lg bg-surface-3 border border-border/40 p-3 mb-5 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">Transaction ID</p>
                    <button
                      onClick={handleCopy}
                      className="rounded p-1 hover:bg-surface-2 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                  <p className="font-mono text-xs shimmer-gold truncate">{txId}</p>
                </div>
              )}

              <div className="flex gap-3">
                {txId && (
                  <Button
                    variant="outline"
                    className="flex-1 border-border/60 hover:bg-surface-3 gap-2"
                    onClick={() => window.open(getExplorerUrl(txId), "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Explorer
                  </Button>
                )}
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={onClose}>
                  Send Another Batch
                </Button>
              </div>
            </div>
          ) : (
            /* Progress state */
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Processing Batch</h2>
                <div className="text-sm text-muted-foreground">{currentStepIndex + 1} / {steps.length}</div>
              </div>

              {/* Stepper */}
              <div className="relative mb-8">
                {/* Progress line — track spans exactly 3×52px between step centers */}
                <div className="absolute left-4 top-4 w-px bg-border/40" style={{ height: "156px" }} />
                <div
                  className="absolute left-4 top-4 w-px bg-gradient-to-b from-primary to-primary/60 transition-all duration-700"
                  style={{ height: `${currentStepIndex * 52}px` }}
                />

                <div className="space-y-5">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = i === currentStepIndex;
                    const isDoneStep = i < currentStepIndex;
                    const isPending = i > currentStepIndex;

                    return (
                      <div key={step.id} className="flex items-center gap-4 relative">
                        <div
                          className={cn(
                            "relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-500",
                            isDoneStep && "bg-primary/20 border-primary/60",
                            isActive && "bg-primary/20 border-primary glow-pulse",
                            isPending && "bg-surface-3 border-border/40"
                          )}
                        >
                          <Icon className={cn(
                            "h-3.5 w-3.5 transition-colors duration-300",
                            isDoneStep && "text-primary",
                            isActive && "text-primary animate-pulse-slow",
                            isPending && "text-muted-foreground/40"
                          )} />
                        </div>
                        <div>
                          <div className={cn("text-sm font-medium transition-colors", isPending ? "text-muted-foreground/40" : "text-foreground")}>
                            {step.label}
                          </div>
                          {isActive && (
                            <div className="text-xs text-muted-foreground mt-0.5 animate-fade-in">
                              {step.sublabel}
                            </div>
                          )}
                          {isDoneStep && (
                            <div className="text-xs text-emerald-400 mt-0.5">Complete</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress bar */}
              <div className="rounded-full bg-surface-3 h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-gold/70 rounded-full transition-all duration-700"
                  style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
