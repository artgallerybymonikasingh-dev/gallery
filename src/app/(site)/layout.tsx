import SiteHeader from "@/components/SiteHeader";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <WhatsAppFloatingButton />
    </>
  );
}
