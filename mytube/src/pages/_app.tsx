import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import Head from "next/head";
// @ts-ignore
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Head>
        <title>My Tube Clone</title>
      </Head>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <Toaster />
        <div className="flex">
          <Sidebar />
          <Component {...pageProps} />
        </div>
      </div>
    </UserProvider>
  );
}
