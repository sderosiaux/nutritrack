"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTimeMin: number;
  illustrationUrl: string | null;
  publishedAt: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  nutrition: "Nutrition",
  sleep: "Sleep",
  stress: "Stress",
  habits: "Habits",
  fitness: "Fitness",
  mindfulness: "Mindfulness",
};

const CATEGORY_COLORS: Record<string, string> = {
  nutrition: "var(--color-primary)",
  sleep: "var(--color-macro-protein)",
  stress: "var(--color-macro-fat)",
  habits: "var(--color-accent)",
  fitness: "var(--color-macro-carbs)",
  mindfulness: "var(--color-macro-fiber)",
};

async function fetchLessons(): Promise<{ lessons: LessonSummary[]; total: number }> {
  const res = await fetch("/api/v1/lessons?limit=100");
  if (!res.ok) throw new Error("Failed to load lessons");
  return res.json();
}

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category;
  const color = CATEGORY_COLORS[category] ?? "var(--color-text-muted)";
  return (
    <span
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
        borderRadius: "var(--radius-full)",
        padding: "2px 10px",
        fontSize: "0.7rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        display: "inline-block",
      }}
    >
      {label}
    </span>
  );
}

function LessonCard({ lesson }: { lesson: LessonSummary }) {
  return (
    <Link href={`/coach/${lesson.slug}`} style={{ textDecoration: "none" }}>
      <Card
        style={{
          height: "100%",
          transition: "box-shadow 150ms ease, transform 150ms ease",
          cursor: "pointer",
        }}
        className="hover:shadow-md hover:-translate-y-0.5"
      >
        {/* Thumbnail */}
        {lesson.illustrationUrl ? (
          <div
            style={{
              height: "120px",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              overflow: "hidden",
              background: `linear-gradient(135deg, color-mix(in srgb, ${CATEGORY_COLORS[lesson.category] ?? "var(--color-primary)"} 15%, var(--color-surface-alt)), var(--color-surface-alt))`,
            }}
          >
            <img
              src={lesson.illustrationUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        ) : (
          <div
            style={{
              height: "120px",
              background: `linear-gradient(135deg, color-mix(in srgb, ${CATEGORY_COLORS[lesson.category] ?? "var(--color-primary)"} 15%, var(--color-surface-alt)), var(--color-surface-alt))`,
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BookOpen
              size={32}
              style={{
                color: CATEGORY_COLORS[lesson.category] ?? "var(--color-primary)",
                opacity: 0.6,
              }}
            />
          </div>
        )}

        <CardHeader style={{ paddingBottom: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <CategoryBadge category={lesson.category} />
          </div>
          <CardTitle style={{ fontSize: "0.95rem", lineHeight: "1.35" }}>
            {lesson.title}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <CardDescription style={{ marginBottom: 8, fontSize: "0.82rem" }}>
            {lesson.summary}
          </CardDescription>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <BookOpen size={12} />
            {lesson.readTimeMin} min read
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <div style={{ height: 120, backgroundColor: "var(--color-surface-alt)" }} />
      <div style={{ padding: "16px 24px 24px" }}>
        <div
          style={{
            height: 10,
            width: 70,
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--color-border)",
            marginBottom: 10,
          }}
        />
        <div
          style={{
            height: 14,
            width: "80%",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--color-border)",
            marginBottom: 8,
          }}
        />
        <div
          style={{
            height: 10,
            width: "60%",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--color-border)",
          }}
        />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        textAlign: "center",
        padding: "64px 24px",
        color: "var(--color-text-muted)",
      }}
    >
      <BookOpen
        size={48}
        style={{ margin: "0 auto 16px", opacity: 0.3 }}
      />
      <h2
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          color: "var(--color-text)",
          marginBottom: 8,
        }}
      >
        No lessons yet
      </h2>
      <p style={{ fontSize: "0.875rem", maxWidth: 320, margin: "0 auto" }}>
        Lessons will appear here once the database is seeded. Run{" "}
        <code style={{ fontSize: "0.8rem" }}>pnpm db:seed</code> to load content.
      </p>
    </div>
  );
}

export default function CoachPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["lessons"],
    queryFn: fetchLessons,
  });

  const lessons = data?.lessons ?? [];

  // Group lessons by category
  const grouped = lessons.reduce<Record<string, LessonSummary[]>>((acc, l) => {
    if (!acc[l.category]) acc[l.category] = [];
    acc[l.category].push(l);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <div style={{ padding: "24px 24px 40px", maxWidth: 1200 }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--color-text)",
          marginBottom: 4,
        }}
      >
        Coach
      </h1>
      <p
        style={{
          color: "var(--color-text-muted)",
          fontSize: "0.9rem",
          marginBottom: 32,
        }}
      >
        Bite-sized lessons to build lasting healthy habits
      </p>

      {isLoading ? (
        <div
          aria-busy="true"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          <EmptyState />
        </div>
      ) : (
        <>
          {categories.map((cat) => (
            <section key={cat} style={{ marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 18,
                    borderRadius: 2,
                    backgroundColor:
                      CATEGORY_COLORS[cat] ?? "var(--color-primary)",
                    display: "inline-block",
                  }}
                />
                {CATEGORY_LABELS[cat] ?? cat}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 16,
                }}
              >
                {grouped[cat].map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
