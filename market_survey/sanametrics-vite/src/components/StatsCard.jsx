import React from "react";
import { motion } from "framer-motion";

/**
 * StatsCard: petite carte statistique avec chiffre principal, variation, et mini-graph (slot).
 * Props:
 *  - title, value, delta (ex: '+12%'), deltaType ('up'|'down'), children (mini chart)
 */
export default function StatsCard({ title, value, delta, deltaType = "up", children }) {
  const deltaColor = deltaType === "up" ? "text-green-600" : "text-red-500";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className="section-card p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted">{title}</div>
          <div className="text-2xl font-extrabold">{value}</div>
        </div>
        <div className={`text-sm font-medium ${deltaColor} self-start`}>{delta}</div>
      </div>

      <div className="mt-2">
        {/* slot pour mini chart */}
        {children}
      </div>
    </motion.div>
  );
}
