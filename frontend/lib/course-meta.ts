import {
  Code2, Brain, Layers, Zap, Globe, Database, Smartphone,
} from "lucide-react";
import { Course } from "./api";

export interface CourseMeta {
  key: string;
  icon: typeof Code2;
  badgeKey: "popular" | "demand" | "career" | "new" | "advanced" | "practical";
  duration: string;
  students: string;
  rating: number;
  tags: string[];
  gradient: string;
  border: string;
  iconBg: string;
  course: Course;
}

// Static metadata for course presentation
const STATIC_META_MAP: Record<string, Omit<CourseMeta, "course" | "duration">> = {
  "python-development": {
    key: "python",
    icon: Code2,
    badgeKey: "popular",
    students: "840+",
    rating: 4.9,
    tags: ["Beginner", "Backend", "Data"],
    gradient: "from-green-600/20 to-green-900/10",
    border: "border-green-500/30 hover:border-green-400/60",
    iconBg: "bg-green-500/10 text-green-400",
  },
  "javascript-typescript": {
    key: "js",
    icon: Globe,
    badgeKey: "demand",
    students: "620+",
    rating: 4.8,
    tags: ["Beginner", "Frontend", "Backend"],
    gradient: "from-blue-600/20 to-blue-900/10",
    border: "border-blue-500/30 hover:border-blue-400/60",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  "frontend-development": {
    key: "frontend",
    icon: Layers,
    badgeKey: "career",
    students: "510+",
    rating: 4.9,
    tags: ["Intermediate", "React", "Next.js"],
    gradient: "from-green-600/20 to-emerald-900/10",
    border: "border-green-500/30 hover:border-green-400/60",
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  "vibe-coding": {
    key: "vibe",
    icon: Zap,
    badgeKey: "new",
    students: "380+",
    rating: 5.0,
    tags: ["All Levels", "AI Tools", "Productivity"],
    gradient: "from-yellow-600/15 to-orange-900/10",
    border: "border-yellow-500/30 hover:border-yellow-400/60",
    iconBg: "bg-yellow-500/10 text-yellow-400",
  },
  "artificial-intelligence": {
    key: "ai",
    icon: Brain,
    badgeKey: "advanced",
    students: "290+",
    rating: 4.8,
    tags: ["Advanced", "ML", "Deep Learning"],
    gradient: "from-purple-600/20 to-purple-900/10",
    border: "border-purple-500/30 hover:border-purple-400/60",
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  "flutter-development": {
    key: "flutter",
    icon: Smartphone,
    badgeKey: "demand",
    students: "180+",
    rating: 4.8,
    tags: ["Beginner", "Mobile", "Cross-platform"],
    gradient: "from-sky-600/20 to-sky-900/10",
    border: "border-sky-500/30 hover:border-sky-400/60",
    iconBg: "bg-sky-500/10 text-sky-400",
  },
  "data-science": {
    key: "data",
    icon: Database,
    badgeKey: "practical",
    students: "310+",
    rating: 4.7,
    tags: ["Intermediate", "Analytics", "Python"],
    gradient: "from-cyan-600/15 to-teal-900/10",
    border: "border-cyan-500/30 hover:border-cyan-400/60",
    iconBg: "bg-cyan-500/10 text-cyan-400",
  },
};

export function mapCoursesToMeta(courses: Course[]): CourseMeta[] {
  return courses
    .filter(course => course.isActive)
    .sort((a, b) => a.order - b.order)
    .map(course => {
      const staticMeta = STATIC_META_MAP[course.slug];
      if (!staticMeta) {
        // Fallback for unmapped courses
        return {
          key: course.slug,
          icon: Code2,
          badgeKey: "new" as const,
          duration: course.duration,
          students: "New",
          rating: 4.5,
          tags: course.tags.slice(0, 3),
          gradient: "from-gray-600/20 to-gray-900/10",
          border: "border-gray-500/30 hover:border-gray-400/60",
          iconBg: "bg-gray-500/10 text-gray-400",
          course,
        };
      }

      return {
        ...staticMeta,
        duration: course.duration,
        course,
      };
    });
}