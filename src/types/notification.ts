export type SerializedNotification = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  commentId: string | null;
  href: string;
  actor: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  post: { id: string; slug: string; title: string } | null;
};
