import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function MeetingContentRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/org/${slug}/meetings?view=content`);
}
