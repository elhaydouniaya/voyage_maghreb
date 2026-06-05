"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buildLoginHref } from "@/lib/auth-redirect";

type Props = {
  className?: string;
  children: React.ReactNode;
  /** Override return path (e.g. /profile?tab=guide-ia) */
  returnTo?: string;
};

export function LoginLink({ className, children, returnTo }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const href = returnTo
    ? buildLoginHref("", "", returnTo)
    : buildLoginHref(pathname, searchParams.toString());

  return (
    <Link href={href} prefetch={false} className={className}>
      {children}
    </Link>
  );
}
