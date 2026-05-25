import MainNavbar from "@/components/layout/MainNavbar";
import SiteFooter from "@/components/layout/SiteFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit flex flex-col">
      <MainNavbar />
      <main className="flex-1 pt-[76px]">{children}</main>
      <SiteFooter />
    </div>
  );
}
