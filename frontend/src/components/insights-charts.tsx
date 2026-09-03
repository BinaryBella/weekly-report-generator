"use client";

import type { ReactElement, ReactNode } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  MemberStatusRow,
  ProjectWorkloadRow,
  SubmissionTrendPoint,
  TaskTypeHoursRow,
  TasksTrendPoint,
} from "@/lib/dashboard";

/**
 * Recharts renderers for the manager insights dashboard. Kept in one client
 * module so the page itself stays a server component. Colours mirror the status
 * pills used elsewhere (blue = submitted, amber = needs correction, emerald =
 * approved / on time, slate = missing).
 */

const COLORS = {
  brand: "#1e3fae",
  completed: "#10b981",
  approved: "#10b981",
  onTime: "#10b981",
  submitted: "#3b82f6",
  late: "#f59e0b",
  needsCorrection: "#f59e0b",
  missing: "#94a3b8",
  axis: "#64748b",
  grid: "#94a3b8",
};

/** Distinct hues for project / task-type slices. */
const CATEGORICAL = [
  "#1e3fae",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const axisTick = { fontSize: 12, fill: COLORS.axis } as const;
const legendStyle = { fontSize: 12 } as const;

function ChartFrame({
  height = 260,
  children,
}: {
  height?: number;
  children: ReactElement;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

/** Tasks completed each week, with the total logged as context. */
export function TasksTrendChart({ data }: { data: TasksTrendPoint[] }) {
  if (data.every((d) => d.total === 0)) {
    return <EmptyChart>No tasks logged in this period yet.</EmptyChart>;
  }
  return (
    <ChartFrame>
      <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={COLORS.grid} strokeOpacity={0.25} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} />
        <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={32} />
        <Tooltip />
        <Legend wrapperStyle={legendStyle} />
        <Area
          type="monotone"
          name="Completed"
          dataKey="completed"
          stroke={COLORS.completed}
          strokeWidth={2}
          fill={COLORS.completed}
          fillOpacity={0.15}
        />
        <Line
          type="monotone"
          name="All tasks logged"
          dataKey="total"
          stroke={COLORS.missing}
          strokeWidth={1.5}
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

/** Stacked bars: on-time / late / not-submitted per week. */
export function SubmissionTrendChart({ data }: { data: SubmissionTrendPoint[] }) {
  if (data.every((d) => d.onTime + d.late + d.missing === 0)) {
    return <EmptyChart>No team members to chart for this period.</EmptyChart>;
  }
  return (
    <ChartFrame>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke={COLORS.grid} strokeOpacity={0.25} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} />
        <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} width={32} />
        <Tooltip />
        <Legend wrapperStyle={legendStyle} />
        <Bar dataKey="onTime" name="On time" stackId="s" fill={COLORS.onTime} />
        <Bar dataKey="late" name="Late" stackId="s" fill={COLORS.late} />
        <Bar
          dataKey="missing"
          name="Not submitted"
          stackId="s"
          fill={COLORS.missing}
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ChartFrame>
  );
}

/** One horizontal stacked bar per team member across the trend window. */
export function MemberStatusChart({ data }: { data: MemberStatusRow[] }) {
  if (data.length === 0) {
    return <EmptyChart>No team members to chart yet.</EmptyChart>;
  }
  return (
    <ChartFrame height={Math.max(200, data.length * 40 + 48)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        <CartesianGrid stroke={COLORS.grid} strokeOpacity={0.25} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} />
        <YAxis
          type="category"
          dataKey="member"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip />
        <Legend wrapperStyle={legendStyle} />
        <Bar dataKey="approved" name="Approved" stackId="s" fill={COLORS.approved} />
        <Bar dataKey="submitted" name="Submitted" stackId="s" fill={COLORS.submitted} />
        <Bar
          dataKey="needsCorrection"
          name="Needs correction"
          stackId="s"
          fill={COLORS.needsCorrection}
        />
        <Bar dataKey="missing" name="Missing" stackId="s" fill={COLORS.missing} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ChartFrame>
  );
}

interface WorkloadTooltipProps {
  active?: boolean;
  payload?: { payload: ProjectWorkloadRow }[];
}

function WorkloadTooltip({ active, payload }: WorkloadTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border bg-card p-2 text-xs shadow-sm">
      <p className="font-medium">{row.project}</p>
      <p className="text-muted-foreground">
        {row.tasks} task{row.tasks === 1 ? "" : "s"} · {row.hours}h spent
      </p>
    </div>
  );
}

/** Task count per project (hours in the tooltip). */
export function ProjectWorkloadChart({ data }: { data: ProjectWorkloadRow[] }) {
  if (data.length === 0) {
    return (
      <EmptyChart>No completed tasks tied to a project in this period.</EmptyChart>
    );
  }
  return (
    <ChartFrame height={Math.max(200, data.length * 40 + 32)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        <CartesianGrid stroke={COLORS.grid} strokeOpacity={0.25} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={axisTick} tickLine={false} />
        <YAxis
          type="category"
          dataKey="project"
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip cursor={{ fill: COLORS.grid, fillOpacity: 0.1 }} content={<WorkloadTooltip />} />
        <Bar dataKey="tasks" name="Tasks" radius={[0, 3, 3, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

/** Team-wide hours split by task type (Development / Testing / Meetings / …). */
export function TaskTypeHoursChart({ data }: { data: TaskTypeHoursRow[] }) {
  if (data.length === 0) {
    return (
      <EmptyChart>
        No hours breakdown recorded — this section is optional for team members.
      </EmptyChart>
    );
  }
  const total = data.reduce((sum, row) => sum + row.hours, 0);
  return (
    <ChartFrame>
      <PieChart>
        <Pie
          data={data}
          dataKey="hours"
          nameKey="type"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => {
            const hours = typeof value === "number" ? value : Number(value) || 0;
            const pct = total > 0 ? Math.round((hours / total) * 100) : 0;
            return `${hours}h (${pct}%)`;
          }}
        />
        <Legend wrapperStyle={legendStyle} />
      </PieChart>
    </ChartFrame>
  );
}
