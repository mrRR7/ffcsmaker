"use client";

import { useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { FPButton } from "@/components/fp-ui/button";
import { FPCard } from "@/components/fp-ui/card";
import { FPLabel } from "@/components/fp-ui/label";
import { FPNote } from "@/components/fp-ui/note";
import { DONATE_PAYEE_NAME, DONATE_QR_SRC, DONATE_UPI_ID } from "@/lib/site";
import { track } from "@/lib/track";

// Opens the user's UPI app with the payee prefilled. The amount is left for them to choose.
const upiLink = `upi://pay?${new URLSearchParams({ pa: DONATE_UPI_ID, pn: DONATE_PAYEE_NAME, cu: "INR" })}`;

export function SupportActions({ showQr }: { showQr: boolean }) {
  useEffect(() => track("support_page_viewed"), []);

  if (!DONATE_UPI_ID) return null;

  async function copyId() {
    try {
      await navigator.clipboard.writeText(DONATE_UPI_ID);
      toast.success("UPI ID copied.");
    } catch {
      toast.error("Couldn't copy. Select the ID and copy it manually.");
    }
  }

  return (
    <FPCard padding="lg" className="mt-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
      {/* White backing keeps the QR scannable in dark mode. */}
      {showQr ? (
        <div className="shrink-0 rounded-[var(--radius-md)] bg-white p-3">
          <Image src={DONATE_QR_SRC} alt="UPI QR code for donations" width={192} height={192} priority />
        </div>
      ) : null}
      <div className="min-w-0">
        <FPLabel>UPI ID</FPLabel>
        <p className="mt-1 break-all font-mono text-[length:var(--text-small)] text-fp-text-strong">{DONATE_UPI_ID}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:justify-start">
          <FPButton variant="secondary" size="sm" onClick={copyId}>
            Copy UPI ID
          </FPButton>
          <a href={upiLink} className="sm:hidden">
            <FPButton variant="primary" size="sm">Open in UPI app</FPButton>
          </a>
        </div>
        <FPNote className="mt-4">
          {showQr ? "Scan with any UPI app" : "Paste the ID into any UPI app"}, or on a phone tap the button to open
          your app. It only opens the app;
          you choose the amount and confirm the payment there.
        </FPNote>
      </div>
    </FPCard>
  );
}
