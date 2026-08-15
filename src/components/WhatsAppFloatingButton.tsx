import { whatsappGeneralLink } from "@/lib/whatsapp";

export default function WhatsAppFloatingButton() {
  return (
    <a
      href={whatsappGeneralLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 active:scale-95"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor" aria-hidden="true">
        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.42.71 4.673 1.933 6.566L4 29l7.617-1.897A11.94 11.94 0 0 0 16.001 27C22.63 27 28 21.627 28 15S22.63 3 16.001 3Zm6.997 16.982c-.297.836-1.47 1.53-2.404 1.727-.64.135-1.475.243-4.287-.921-3.598-1.487-5.913-5.14-6.094-5.38-.176-.24-1.464-1.948-1.464-3.716 0-1.767.925-2.635 1.253-2.997.298-.328.65-.41.867-.41.216 0 .434.002.623.011.2.01.469-.076.734.56.297.712.945 2.284 1.028 2.45.083.166.14.36.028.577-.111.216-.166.35-.325.539-.166.187-.343.417-.49.56-.166.166-.34.346-.146.68.194.335.862 1.42 1.851 2.301 1.271 1.135 2.342 1.487 2.677 1.653.335.166.529.14.723-.083.2-.222.834-.972 1.056-1.306.222-.335.446-.279.75-.166.305.111 1.93.909 2.263 1.075.334.166.556.25.639.39.083.14.083.804-.213 1.641Z" />
      </svg>
    </a>
  );
}
