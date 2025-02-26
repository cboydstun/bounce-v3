import AdminChatPanel from "@/components/chat/AdminChatPanel";

export const metadata = {
  title: "Admin Chat | SATX Bounce",
  description: "Manage customer chat sessions",
};

export default function AdminChatPage() {
  return (
    <div className="-mx-8 -my-6">
      <AdminChatPanel />
    </div>
  );
}
