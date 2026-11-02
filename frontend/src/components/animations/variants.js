// Reusable animation variants. Keep motion subtle and consistent — reach
// for these instead of writing one-off transition configs on each component.

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export const staggerChildren = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)" },
  hover: {
    y: -3,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.08)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
};

export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } },
};

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
