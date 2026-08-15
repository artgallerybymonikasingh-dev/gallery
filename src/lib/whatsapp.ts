const RAW_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

// wa.me requires digits only (country code + number, no + or spaces).
const DIGITS_ONLY = RAW_NUMBER.replace(/\D/g, "");

export function whatsappGeneralLink(): string {
  const message = "Hi! I'd like to know more about the artwork on your website.";
  return `https://wa.me/${DIGITS_ONLY}?text=${encodeURIComponent(message)}`;
}

export function whatsappEnquiryLink(artworkTitle: string, artistName: string): string {
  const message = `Hi, I'm interested in "${artworkTitle}" by ${artistName}.`;
  return `https://wa.me/${DIGITS_ONLY}?text=${encodeURIComponent(message)}`;
}
