import { FC } from "react";
import Navbar from "./navbar";
import Footer from "./footer";
import ComparisonBar from "@/components/comparison/comparison-bar";

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen backgroundSand">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <ComparisonBar />
    </div>
  );
};

export default Layout;
