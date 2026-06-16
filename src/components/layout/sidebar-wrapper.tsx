import { Sidebar } from "./sidebar";
import { getUnreadAlertCount } from "@/app/actions/alerts";

export async function SidebarWrapper() {
  const unreadCount = await getUnreadAlertCount();
  return <Sidebar unreadAlertCount={unreadCount} />;
}