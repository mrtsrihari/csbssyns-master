import "./../styles/globals.css";
import { Analytics } from "@vercel/analytics/next"
export const metadata = {
  title: "CSBS SYNC",
  description: "Official class portal for CSBS Department",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Analytics/> 
        {children}
      </body>
    </html>
  );
}