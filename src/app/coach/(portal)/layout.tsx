import CoachSidebar from "@/components/layout/CoachSidebar";
import CoachMobileNav from "@/components/layout/CoachMobileNav";

export default function CoachPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg-main">
      <CoachSidebar />
      <CoachMobileNav />
      <main className="md:ml-64 pb-20 md:pb-0 p-5 md:p-10 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
