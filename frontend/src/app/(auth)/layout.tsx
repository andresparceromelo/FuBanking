import { AuthSplitLayout } from '@/features/landing/components/AuthSplitLayout';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthSplitLayout>{children}</AuthSplitLayout>;
}
