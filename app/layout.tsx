import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Information Retrieval Metrics Simulation",
  description:
    "An interactive tool to simulate and visualize various Information Retrieval metrics including NDCG, Precision, Recall, MAP, and MRR.",
  keywords: [
    "Information Retrieval",
    "NDCG",
    "Precision",
    "Recall",
    "MAP",
    "MRR",
    "Simulation",
    "Interactive",
  ],
  authors: [{ name: "kiwamizamurai" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
