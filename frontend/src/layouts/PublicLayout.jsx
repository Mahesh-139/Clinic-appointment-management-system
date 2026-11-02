import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { pageTransition } from "../components/animations/variants.js";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <motion.main
        className="flex-1"
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  );
}
