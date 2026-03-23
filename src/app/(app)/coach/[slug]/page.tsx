"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen, Clock, Tag } from "lucide-react";

interface LessonDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  category: string;
  tags: string[];
  readTimeMin: number;
  illustrationUrl: string | null;
  order: number;
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

async function fetchLesson(slug: string): Promise<LessonDetail> {
  const res = await fetch(`/api/v1/lessons/${slug}`);
  if (!res.ok) {
    throw Object.assign(new Error("Lesson not found"), { status: res.status });
  }
  return res.json();
}

/** Render markdown as simple HTML — handles headers, bold, tables, lists. */
function MarkdownBody({ markdown }: { markdown: string }) {
  // Simple markdown parser — sufficient for article-style content
  const html = markdown
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Tables (basic)
    .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (_, header, rows) => {
      const ths = header
        .split("|")
        .filter(Boolean)
        .map((h: string) => `<th>${h.trim()}</th>`)
        .join("");
      const trs = rows
        .trim()
        .split("\n")
        .map((row: string) => {
          const tds = row
            .split("|")
            .filter(Boolean)
            .map((d: string) => `<td>${d.trim()}</td>`)
            .join("");
          return `<tr>${tds}</tr>`;
        })
        .join("");
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    })
    // Unordered lists
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // Paragraphs (blank line separated)
    .replace(/\n{2,}/g, "\n\n")
    .split("\n\n")
    .map((para) => {
      const trimmed = para.trim();
      if (
        trimmed.startsWith("<h") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<table") ||
        trimmed === ""
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{
        lineHeight: 1.75,
        color: "var(--color-text)",
        fontSize: "0.975rem",
      }}
      className="lesson-body"
    />
  );
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse" style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ height: 14, width: 80, backgroundColor: "var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: 32 }} />
      <div style={{ height: 200, backgroundColor: "var(--color-surface-alt)", borderRadius: "var(--radius-lg)", marginBottom: 32 }} />
      <div style={{ height: 28, width: "70%", backgroundColor: "var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: 12 }} />
      <div style={{ height: 16, width: "40%", backgroundColor: "var(--color-border)", borderRadius: "var(--radius-sm)", marginBottom: 32 }} />
      {[90, 70, 80, 60, 75].map((w, i) => (
        <div
          key={i}
          style={{
            height: 14,
            width: `${w}%`,
            backgroundColor: "var(--color-border)",
            borderRadius: "var(--radius-sm)",
            marginBottom: 12,
          }}
        />
      ))}
    </div>
  );
}

export default function LessonDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const { data: lesson, isLoading, isError } = useQuery({
    queryKey: ["lesson", slug],
    queryFn: () => fetchLesson(slug),
    enabled: !!slug,
  });

  if (isLoading) return <SkeletonDetail />;

  if (isError || !lesson) {
    return (
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            color: "var(--color-text)",
            marginBottom: 12,
          }}
        >
          Lesson not found
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>
          This lesson could not be loaded. It may have been moved or removed.
        </p>
        <Link
          href="/coach"
          style={{
            color: "var(--color-primary)",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowLeft size={16} /> Back to Coach
        </Link>
      </div>
    );
  }

  const categoryColor = CATEGORY_COLORS[lesson.category] ?? "var(--color-primary)";
  const categoryLabel = CATEGORY_LABELS[lesson.category] ?? lesson.category;

  return (
    <article style={{ maxWidth: 720, margin: "0 auto", padding: "24px 24px 64px" }}>
      {/* Back navigation */}
      <Link
        href="/coach"
        aria-label="Back to lessons"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-text-muted)",
          fontSize: "0.875rem",
          textDecoration: "none",
          marginBottom: 24,
          transition: "color 150ms ease",
        }}
        className="hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={16} /> Back
      </Link>

      {/* Cover illustration */}
      {lesson.illustrationUrl ? (
        <div
          style={{
            height: 200,
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: 32,
            background: `linear-gradient(135deg, color-mix(in srgb, ${categoryColor} 15%, var(--color-surface-alt)), var(--color-surface-alt))`,
          }}
        >
          <img
            src={lesson.illustrationUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      ) : (
        <div
          style={{
            height: 200,
            borderRadius: "var(--radius-lg)",
            background: `linear-gradient(135deg, color-mix(in srgb, ${categoryColor} 15%, var(--color-surface-alt)), var(--color-surface-alt))`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <BookOpen size={48} style={{ color: categoryColor, opacity: 0.4 }} />
        </div>
      )}

      {/* Meta */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {/* Category badge */}
        <span
          style={{
            color: categoryColor,
            backgroundColor: `color-mix(in srgb, ${categoryColor} 12%, transparent)`,
            borderRadius: "var(--radius-full)",
            padding: "2px 10px",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {categoryLabel}
        </span>

        {/* Read time */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
          }}
        >
          <Clock size={13} />
          {lesson.readTimeMin} min read
        </span>

        {/* Published date */}
        {lesson.publishedAt && (
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {new Date(lesson.publishedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Title */}
      <h1
        style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          color: "var(--color-text)",
          lineHeight: 1.25,
          marginBottom: 8,
        }}
      >
        {lesson.title}
      </h1>

      {/* Summary */}
      <p
        style={{
          fontSize: "1rem",
          color: "var(--color-text-muted)",
          marginBottom: 32,
          lineHeight: 1.6,
        }}
      >
        {lesson.summary}
      </p>

      <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", marginBottom: 32 }} />

      {/* Body */}
      <MarkdownBody markdown={lesson.bodyMarkdown} />

      {/* Tags */}
      {lesson.tags && lesson.tags.length > 0 && (
        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            alignItems: "center",
          }}
        >
          <Tag size={14} style={{ color: "var(--color-text-muted)" }} />
          {lesson.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                backgroundColor: "var(--color-surface-alt)",
                borderRadius: "var(--radius-full)",
                padding: "3px 10px",
                border: "1px solid var(--color-border)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
