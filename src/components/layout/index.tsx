import { FC } from "react";
import Navbar from "./navbar";
import Footer from "./footer";

const Layout: FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen backgroundSand">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
