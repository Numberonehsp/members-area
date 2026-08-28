import MemberSidebar from "@/components/layout/MemberSidebar";
import MemberMobileHeader from "@/components/layout/MemberMobileHeader";
import MemberMobileNav from "@/components/layout/MemberMobileNav";

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main">
      <MemberSidebar />
      <MemberMobileHeader />
      <MemberMobileNav />
      <main className="md:ml-64 pb-20 md:pb-0 p-5 md:p-10 max-w-6xl">
        {children}
      </main>
    </div>
  );
}
