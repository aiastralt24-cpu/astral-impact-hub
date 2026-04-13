import { redirect } from "next/navigation";
import Image from "next/image";

import { BrandMark } from "@/components/app-shell/brand-mark";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { loginAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="section-shell glass-panel grid w-full max-w-5xl overflow-hidden rounded-[40px] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[#eef2f6] lg:block">
          <Image
            src="/brand/astral-foundation-logo.jpg"
            alt="Astral Foundation logo"
            fill
            priority
            className="object-cover object-center"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <Card className="w-full rounded-none border-0 bg-transparent shadow-none">
          <CardHeader className="px-8 pt-8 lg:px-12 lg:pt-16">
            <CardTitle className="text-3xl text-[var(--foreground)]">Sign in to Astral Impact Hub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8 lg:px-12 lg:pb-12">
            <form action={loginAction} className="space-y-4">
              <select name="role" defaultValue="admin" className="h-12 w-full rounded-2xl px-4">
                <option value="admin">Admin</option>
                <option value="project_manager">Project manager</option>
                <option value="content_team">Content team</option>
                <option value="vendor">Vendor</option>
                <option value="leadership">Leadership</option>
              </select>
              <Button className="w-full">Continue</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
