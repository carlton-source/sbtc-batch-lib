import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Download, Upload, FileText, X } from "lucide-react";

function validateAddress(addr: string): boolean {
  return /^(1|3|bc1|BC1|SP|SM)[a-zA-HJ-NP-Z0-9]{8,}$/.test(addr.trim());
}

interface ParsedRow {
  line: number;
  address: string;
  amount: string;
  valid: boolean;
  error?: string;
}

interface CSVInputProps {
  onImport: (rows: ParsedRow[]) => void;
}

function parseCSV(text: string): ParsedRow[] {
  return text
    .split("\n")
    .map((line, i) => ({ rawLine: line.trim(), lineNum: i + 1 }))
    .filter(({ rawLine }) => rawLine.length > 0)
    .map(({ rawLine, lineNum }) => {
      const parts = rawLine.split(",").map((p) => p.trim());
      const address = parts[0] || "";
      const amount = parts[1] || "";

      if (!address) {
        return { line: lineNum, address, amount, valid: false, error: "Missing address" };
      }
      if (!validateAddress(address)) {
        return { line: lineNum, address, amount, valid: false, error: "Invalid address format" };
      }
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return { line: lineNum, address, amount, valid: false, error: "Invalid amount" };
      }
      return { line: lineNum, address, amount, valid: true };
    });
}

const PLACEHOLDER = `SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ, 50000
SP3GWX3NE58KJET25ZZ6D193D4D3EMXT5E8KXNJV, 25000
SP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8K, 75000`;

export function CSVInput({ onImport }: CSVInputProps) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv" && file.type !== "text/plain") return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      setHasParsed(false);
      setParsed([]);
      setLoadedFileName(file.name);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  const handleParse = () => {
    const rows = parseCSV(text);
    setParsed(rows);
    setHasParsed(true);
  };

  const handleImport = () => {
    onImport(parsed.filter((r) => r.valid));
  };

  const clearFile = () => {
    setText("");
    setLoadedFileName(null);
    setHasParsed(false);
    setParsed([]);
  };

  const validCount = parsed.filter((r) => r.valid).length;
  const invalidCount = parsed.filter((r) => !r.valid).length;

  const lines = text.split("\n");

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">
            Format: <span className="font-mono text-foreground">address, amount_in_sats</span> (one per line)
          </p>
          {loadedFileName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/30 px-2 py-0.5 text-xs text-primary font-mono">
              <FileText className="h-3 w-3" />
              {loadedFileName}
              <button
                onClick={clearFile}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label="Clear file"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          )}
        </div>
      <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => {
            const csv = "address,amount_sats\nSP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ,500000\nSP3GWX3NE58KJET25ZZ6D193D4D3EMXT5E8KXNJV,250000\nSP1HTBVD3JG9C05J7HBJTHGR0GGW7KXW28M5JS8K,750000";
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "batchpay-template.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-3 w-3" />
          Template
        </Button>
      </div>

      {/* Drop zone — shown when textarea is empty */}
      {!text && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 py-6",
            dragOver
              ? "border-primary/70 bg-primary/10 glow-violet"
              : "border-border/40 bg-surface-2 hover:border-primary/40 hover:bg-primary/5"
          )}
        >
          <Upload className={cn("h-5 w-5 transition-colors", dragOver ? "text-primary" : "text-muted-foreground")} />
          <p className="text-sm text-muted-foreground">
            Drop a <span className="text-foreground font-medium">.csv</span> file here
          </p>
          <p className="text-xs text-muted-foreground/60">or click to browse</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
          />
        </div>
      )}

      {/* Line-numbered textarea */}
      <div className="relative flex rounded-lg border border-border/60 bg-surface-2 overflow-hidden font-mono text-sm">
        {/* Line numbers */}
        <div className="select-none py-3 px-3 text-right text-muted-foreground/50 bg-surface-3/50 border-r border-border/40 min-w-[3rem]">
          {(text || PLACEHOLDER).split("\n").map((_, i) => (
            <div key={i} className={cn("leading-6 text-xs", hasParsed && parsed[i] ? (parsed[i].valid ? "text-emerald-500/70" : "text-destructive/70") : "")}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea — also a drop target when text is present */}
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setHasParsed(false); setLoadedFileName(null); }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          placeholder={PLACEHOLDER}
          className="flex-1 resize-none bg-transparent py-3 px-3 outline-none placeholder:text-muted-foreground/30 leading-6 min-h-[200px]"
          spellCheck={false}
        />

        {/* Row indicators */}
        {hasParsed && (
          <div className="absolute right-3 top-3 flex flex-col">
            {lines.filter((l) => l.trim()).map((_, i) => (
              <div key={i} className="leading-6 h-6 flex items-center">
                {parsed[i] ? (
                  parsed[i].valid
                    ? <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    : <XCircle className="h-3 w-3 text-destructive" />
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview table */}
      {hasParsed && parsed.length > 0 && (
        <div className="rounded-lg border border-border/60 overflow-hidden">
          {/* Summary bar */}
          <div className="flex items-center gap-3 px-3 py-2 bg-surface-3 border-b border-border/40 text-xs">
            <span className="text-emerald-400 font-medium">{validCount} valid</span>
            {invalidCount > 0 && (
              <span className="text-destructive font-medium">{invalidCount} invalid</span>
            )}
          </div>
          {/* Scrollable table */}
          <div className="max-h-52 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-surface-3/50">
                  <th className="px-3 py-1.5 text-left text-muted-foreground font-medium w-8">#</th>
                  <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">Address</th>
                  <th className="px-3 py-1.5 text-right text-muted-foreground font-medium">Amount</th>
                  <th className="px-3 py-1.5 text-right text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((row) => (
                  <tr
                    key={row.line}
                    className={cn(
                      "border-b border-border/30 last:border-0 transition-colors",
                      row.valid ? "bg-emerald-500/5" : "bg-destructive/5"
                    )}
                  >
                    <td className="px-3 py-1.5 text-muted-foreground font-mono">{row.line}</td>
                    <td className="px-3 py-1.5 font-mono text-foreground truncate max-w-[140px]">
                      {row.address || <span className="text-muted-foreground italic">—</span>}
                    </td>
                    <td className="px-3 py-1.5 font-mono text-right">
                      {row.amount || <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {row.valid ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-destructive">
                          <XCircle className="h-3 w-3" /> {row.error}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {!hasParsed && <span>{lines.filter((l) => l.trim()).length} rows entered</span>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleParse}
            className="border-border/60 hover:bg-surface-3"
            disabled={!text.trim()}
          >
            Validate
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!hasParsed || validCount === 0}
          >
            Import {validCount > 0 ? `${validCount} rows` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
