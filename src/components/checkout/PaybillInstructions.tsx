"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { SITE } from "@/lib/site";
import { formatKES } from "@/lib/utils";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-wider text-graphite">{label}</p>
        <p className="font-serif text-2xl leading-tight text-charcoal">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex h-9 items-center gap-1.5 rounded-full border border-charcoal/15 px-3 text-xs font-medium text-charcoal transition-colors hover:border-charcoal"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function PaybillInstructions({
  amount,
  code,
  onCode,
}: {
  amount: number;
  code: string;
  onCode: (v: string) => void;
}) {
  const { paybill, account, businessName, bank } = SITE.mpesa;

  return (
    <div className="rounded-2xl border border-pink/40 bg-blush-50 p-5">
      <p className="mb-1 font-serif text-xl text-charcoal">Pay with M-Pesa</p>
      <p className="mb-4 text-sm text-graphite">
        On your phone, open <strong>M-Pesa → Lipa na M-Pesa → Pay Bill</strong> and enter:
      </p>

      <div className="space-y-2.5">
        <CopyRow label={`Business no. (${bank} Paybill)`} value={paybill} />
        <CopyRow label="Account number" value={account} />
        <CopyRow label="Amount" value={String(amount)} />
      </div>

      <ol className="mt-4 space-y-1.5 text-sm text-graphite">
        <li>1. Go to <strong>M-Pesa</strong> → <strong>Lipa na M-Pesa</strong> → <strong>Pay Bill</strong>.</li>
        <li>2. Business number: <strong>{paybill}</strong> ({bank}).</li>
        <li>3. Account number: <strong>{account}</strong>.</li>
        <li>4. Amount: <strong>{formatKES(amount)}</strong>, then enter your PIN.</li>
        <li>5. You&apos;ll get an M-Pesa SMS with a confirmation code — paste it below.</li>
      </ol>

      <p className="mt-3 text-xs text-graphite">
        Paying <strong>{businessName}</strong>.
      </p>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium">
          M-Pesa confirmation code <span className="font-normal text-graphite">(from the SMS)</span>
        </label>
        <input
          value={code}
          onChange={(e) => onCode(e.target.value.toUpperCase())}
          placeholder="e.g. TIK7H2P9QZ"
          className="h-12 w-full rounded-xl border border-charcoal/15 bg-white/70 px-4 text-sm uppercase tracking-wider focus:border-coral focus:outline-none"
        />
        <p className="mt-2 text-xs text-graphite">
          Not received the SMS yet? You can still place the order — we&apos;ll match your
          payment and confirm on WhatsApp.
        </p>
      </div>
    </div>
  );
}
