import BehaviorTracker from "@/components/analytics/BehaviorTracker";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BehaviorTracker />
    </>
  );
}
