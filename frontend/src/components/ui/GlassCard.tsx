import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className = "", onClick }: GlassCardProps) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`
        bg-white/40 backdrop-blur-xl 
        border border-white/60 
        shadow-[0_8px_32px_0_rgba(215,164,136,0.2)] 
        rounded-3xl p-8 
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
