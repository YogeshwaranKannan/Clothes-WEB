export function isMobileDevice(): boolean {
  const nav: any = navigator;
  const ua = navigator.userAgent || "";
  if (nav.userAgentData?.mobile) return true;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  return /Macintosh|Linux|X11/i.test(ua) && navigator.maxTouchPoints > 1;
}

/** Built manually: URLSearchParams turns spaces into "+" and encodes "@", which some UPI apps reject. */
export function buildUpiQuery(opts: {
  upiId: string;
  payeeName: string;
  amount: number;
  note?: string;
}): string {
  const parts = [
    `pa=${opts.upiId}`,
    `pn=${encodeURIComponent(opts.payeeName || "Merchant")}`,
    `cu=INR`,
  ];
  if (opts.amount > 0) parts.push(`am=${opts.amount.toFixed(2)}`);
  if (opts.note) parts.push(`tn=${encodeURIComponent(opts.note.slice(0, 50))}`); // UPI note limit is 50 chars
  return parts.join("&");
}
