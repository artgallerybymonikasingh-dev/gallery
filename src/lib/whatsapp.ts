const DEFAULT_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

// wa.me requires digits only (country code + number, no + or spaces).
function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function resolveNumber(override?: string | null): string {
  const overrideDigits = digitsOnly(override);
  return overrideDigits.length > 0 ? overrideDigits : digitsOnly(DEFAULT_NUMBER);
}

// `phoneNumber` lets a gallery override the site-wide WhatsApp number
// (set per-gallery in the admin panel); falls back to
// NEXT_PUBLIC_WHATSAPP_NUMBER when not provided.
export function whatsappGeneralLink(phoneNumber?: string | null): string {
  const message = "Hi! I'd like to know more about the artwork on your website.";
  return `https://wa.me/${resolveNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
}

export function whatsappEnquiryLink(
  artworkTitle: string,
  artistName: string,
  phoneNumber?: string | null
): string {
  const message = `Hi, I'm interested in "${artworkTitle}" by ${artistName}.`;
  return `https://wa.me/${resolveNumber(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
