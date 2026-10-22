export type TaskFrequency = "daily" | "weekdays" | "weekly" | "monthly" | "custom";

export interface ScheduledTask {
  id: string;
  title: string;
  prompt: string;
  icon: string;
  frequency: TaskFrequency;
  time: string;
  dayOfWeek?: string;
  isActive: boolean;
  createdAt: number;
  lastRun?: string;
  nextRun?: string;
  runOnComputer?: boolean;
  notifications?: "Important updates" | "Failed runs only";
  startInNewChat?: boolean;
  model?: string;
  effort?: "Low" | "Medium" | "High";
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  suggestedFrequency: TaskFrequency;
  suggestedTime: string;
  suggestedDay?: string;
}

export const DEFAULT_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: "news-updates",
    title: "News updates",
    description: "Send me a daily roundup of news on topics I care about.",
    icon: "☀️",
    suggestedFrequency: "daily",
    suggestedTime: "08:00 AM",
  },
  {
    id: "email-monitor",
    title: "Email monitor",
    description: "Scan my emails and let me know anything that needs my attention",
    icon: "✉️",
    suggestedFrequency: "weekdays",
    suggestedTime: "09:00 AM",
  },
  {
    id: "weekend-reads",
    title: "Find weekend reads",
    description: "Send me a great article to read every Saturday.",
    icon: "📖",
    suggestedFrequency: "weekly",
    suggestedTime: "09:00 AM",
    suggestedDay: "Saturday",
  },
  {
    id: "price-alerts",
    title: "Price alerts",
    description: "Check prices daily and alert me when my item costs less.",
    icon: "🏷️",
    suggestedFrequency: "daily",
    suggestedTime: "12:00 PM",
  },
  {
    id: "find-concerts",
    title: "Find concerts",
    description: "Check weekly for new concerts that match my taste.",
    icon: "🎵",
    suggestedFrequency: "weekly",
    suggestedTime: "04:00 PM",
    suggestedDay: "Friday",
  },
  {
    id: "plan-weekend",
    title: "Plan my weekend",
    description: "Send me local weekend ideas every Thursday.",
    icon: "🎉",
    suggestedFrequency: "weekly",
    suggestedTime: "05:00 PM",
    suggestedDay: "Thursday",
  },
];
