// wa.me requires digits only (country code + number, no + or spaces).
function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function resolveNumber(override: string | null | undefined, siteDefault: string): string {
  const overrideDigits = digitsOnly(override);
  return overrideDigits.length > 0 ? overrideDigits : digitsOnly(siteDefault);
}

// `phoneNumber` lets a gallery/artwork/artist override the site-wide
// WhatsApp number (set per-item in the admin panel); `siteDefault` is the
// resolved site-wide number (from /admin/settings) that every caller must
// fetch and pass in — see getSiteWhatsappNumber() in lib/siteSettings.ts.
export function whatsappGeneralLink(phoneNumber: string | null | undefined, siteDefault: string): string {
  const message = "Hi! I'd like to know more about the artwork on your website.";
  return `https://wa.me/${resolveNumber(phoneNumber, siteDefault)}?text=${encodeURIComponent(message)}`;
}

export function whatsappEnquiryLink(
  artworkTitle: string,
  artistName: string,
  phoneNumber: string | null | undefined,
  siteDefault: string
): string {
  const message = `Hi, I'm interested in "${artworkTitle}" by ${artistName}.`;
  return `https://wa.me/${resolveNumber(phoneNumber, siteDefault)}?text=${encodeURIComponent(message)}`;
}
