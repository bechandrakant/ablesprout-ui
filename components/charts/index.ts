import dynamic from "next/dynamic";
import { createElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Recharts is the heaviest dependency: load it only when a chart is on screen.
const loading = () => createElement(Skeleton, { className: "h-48 w-full rounded-xl" });
export const BarListChart = dynamic(() => import("./bar-list-chart"), { ssr: false, loading });
export const DonutChart = dynamic(() => import("./donut-chart"), { ssr: false, loading });
export const ProgressLineChart = dynamic(() => import("./progress-line-chart"), { ssr: false, loading });
