import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function WebLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[84rem] flex-1 px-4 py-10 sm:px-6">{children}</main>
        <Footer />
      </div>
    </Providers>
  );
}
