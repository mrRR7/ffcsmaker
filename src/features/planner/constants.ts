import {
  ClipboardList,
  FileUp,
  Pencil,
  Search,
} from "lucide-react";

export const PLANNER_TABS = [
  { id: "search", label: "Search Catalog", mobileLabel: "Search", icon: Search },
  { id: "paste", label: "Paste Text", mobileLabel: "Paste", icon: ClipboardList },
  { id: "import", label: "Import File", mobileLabel: "File", icon: FileUp },
  { id: "manual", label: "Manual Entry", mobileLabel: "Manual", icon: Pencil }
] as const;

export type PlannerTabId = (typeof PLANNER_TABS)[number]["id"];
