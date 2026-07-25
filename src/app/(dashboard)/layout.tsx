import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50">
        <Navbar />
        <main className="p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
    </Providers>
  );
}
