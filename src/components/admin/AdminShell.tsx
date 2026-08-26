import { AdminMobileNav, AdminSidebar } from "./AdminNav";
import { LogoutButton } from "./LogoutButton";
import { NotificationBell } from "./NotificationBell";

export function AdminShell({
  active,
  title,
  children,
}: {
  active: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-root flex min-h-screen bg-sand text-charcoal">
      <AdminSidebar active={active} />

      {/* min-w-0 so wide tables scroll inside this column instead of stretching
          the whole page sideways on a phone. */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-charcoal/10 bg-cream/80 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <AdminMobileNav active={active} />
          <h1 className="min-w-0 flex-1 truncate font-serif text-xl sm:text-2xl">{title}</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="md:hidden">
              <LogoutButton compact />
            </div>
          </div>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
