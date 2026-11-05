import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthShell title="Join The Himalayan Roots" subtitle="Book village stays and save your trip plans.">
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
