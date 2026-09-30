import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plan your FFCS courses",
  description: "Add your VIT courses, pick professors and slots to avoid, then generate every clash-free FFCS timetable. Works for Vellore, Chennai and Bhopal.",
  alternates: { canonical: "/planner" }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
