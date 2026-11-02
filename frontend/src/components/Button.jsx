import React from "react";
import { motion } from "framer-motion";

/**
 * Reusable button. variant: "primary" | "secondary" | "ghost" | "danger"
 */
export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  className = "",
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-clinic-600 text-white hover:bg-clinic-700 focus-visible:outline-clinic-600",
    secondary:
      "border border-clinic-600 text-clinic-700 hover:bg-clinic-50 focus-visible:outline-clinic-600",
    ghost: "text-clinic-700 hover:bg-clinic-50 focus-visible:outline-clinic-600",
    danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={`${base} ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
