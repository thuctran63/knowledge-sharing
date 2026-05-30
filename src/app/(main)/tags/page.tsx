import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function TagsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  if (q?.trim()) {
    redirect(`/search?tab=tags&q=${encodeURIComponent(q.trim())}`);
  }
  redirect("/search?tab=tags");
}
