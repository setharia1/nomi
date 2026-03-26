import { redirect } from "next/navigation";

export default function SearchFallbackPage() {
  redirect("/search");
}
