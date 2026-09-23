import { MiniProviders } from "@/components/MiniProviders";
import { MiniHeader } from "@/components/MiniHeader";
import { MiniNav } from "@/components/MiniNav";

export default function MiniLayout({ children }: { children: React.ReactNode }) {
  return (
    <MiniProviders>
      <div className="mx-auto min-h-dvh max-w-lg bg-void">
        <MiniHeader />
        <main className="px-3 pb-24 pt-4">{children}</main>
        <MiniNav />
      </div>
    </MiniProviders>
  );
}
