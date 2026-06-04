import type { PkLoaderIcon } from "@/components/ui/PkIconLoader";

export function loaderIconFromPath(pathname: string): PkLoaderIcon {
  if (pathname.startsWith("/dashboard")) return "generator";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/sample-lab")) return "library";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/admin/growth")) return "growth";
  if (pathname.startsWith("/community") || pathname.startsWith("/explore") || pathname.startsWith("/loop/")) {
    return "community";
  }
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/auth")) return "generator";
  return "generator";
}
