import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Management | SATX Bounce House Rentals Admin',
  description: 'Manage contact requests and inquiries',
};

export default function ContactsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
