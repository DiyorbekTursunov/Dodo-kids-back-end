// app/thank-you/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank you", // ← Ana shu yer o‘zgaradi
  description: "Thank you page description",
};

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
