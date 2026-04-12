import './globals.css';

export const metadata = {
  title: 'ChatApp — AI Powered',
  description: 'Team chat with AI integration',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}