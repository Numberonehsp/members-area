import MemberSidebar from "@/components/layout/MemberSidebar";
import MemberMobileNav from "@/components/layout/MemberMobileNav";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main">
      <MemberSidebar />
      <MemberMobileNav />
      <main className="md:ml-64 pb-20 md:pb-0 p-5 md:p-10 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
