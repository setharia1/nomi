"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";
import { PageTransition } from "./PageTransition";
import { VideoGenerationExperience } from "@/components/generation/VideoGenerationExperience";

export function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/home";

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col",
        "nomi-ambient",
        isHome && "nomi-ambient-immersive nomi-feed-chrome h-dvh overflow-hidden max-h-dvh",
      )}
    >
      <TopNav variant={isHome ? "immersive" : "default"} />
      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isHome
            ? "w-full max-w-none px-0 pb-0 pt-0"
            : "mx-auto w-full max-w-lg px-4 pb-[calc(var(--nomi-nav-h)+1.25rem)] pt-[calc(var(--nomi-header-h)+1rem)] md:max-w-xl md:px-5 lg:max-w-2xl xl:max-w-[44rem] xl:px-7 2xl:max-w-[48rem]",
        )}
      >
        <PageTransition home={isHome}>{children}</PageTransition>
      </main>
      <VideoGenerationExperience />
      <BottomNav floating={isHome} />
    </div>
  );
}
