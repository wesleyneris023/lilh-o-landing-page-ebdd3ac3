import { createFileRoute } from "@tanstack/react-router";
import LilhaoAdminDashboard from "@/components/LilhaoAdminDashboard";

export const Route = createFileRoute("/admin")({
  component: LilhaoAdminDashboard,
});
