export type ColumnFormat = "text" | "date" | "badge" | "clamp" | "link";

export type ColumnDef = {
  key: string;
  label: string;
  format?: ColumnFormat;
};

export type TableView = {
  href: string;
  title: string;
  description: string;
  table: "bugs" | "feedback" | "support_emails" | "sentry_events" | "user_events";
  order: string;
  columns: ColumnDef[];
};

export const TABLE_VIEWS = {
  bugs: {
    href: "/bugs",
    title: "Bugs",
    description: "Read-only list from the bugs table, newest first.",
    table: "bugs",
    order: "created_at",
    columns: [
      { key: "created_at", label: "Created", format: "date" },
      { key: "status", label: "Status", format: "badge" },
      { key: "title", label: "Title" },
      { key: "affected_count", label: "Affected" },
      { key: "error_message", label: "Error", format: "clamp" },
    ],
  },
  feedback: {
    href: "/feedback",
    title: "Feedback",
    description: "Read-only list from the feedback table, newest first.",
    table: "feedback",
    order: "created_at",
    columns: [
      { key: "created_at", label: "Created", format: "date" },
      { key: "rating", label: "Rating" },
      { key: "category", label: "Category", format: "badge" },
      { key: "user_email", label: "Email" },
      { key: "message", label: "Message", format: "clamp" },
    ],
  },
  support: {
    href: "/support",
    title: "Support",
    description: "Read-only list from support_emails, newest first.",
    table: "support_emails",
    order: "received_at",
    columns: [
      { key: "received_at", label: "Received", format: "date" },
      { key: "status", label: "Status", format: "badge" },
      { key: "from_email", label: "From" },
      { key: "subject", label: "Subject" },
    ],
  },
  sentry: {
    href: "/sentry",
    title: "Sentry",
    description: "Read-only list from sentry_events, newest first.",
    table: "sentry_events",
    order: "received_at",
    columns: [
      { key: "received_at", label: "Received", format: "date" },
      { key: "level", label: "Level", format: "badge" },
      { key: "status", label: "Status", format: "badge" },
      { key: "title", label: "Title" },
      { key: "platform", label: "Platform" },
      { key: "times_seen", label: "Seen" },
      { key: "permalink", label: "Sentry", format: "link" },
    ],
  },
  analytics: {
    href: "/analytics",
    title: "Analytics",
    description: "Read-only list from user_events, newest first.",
    table: "user_events",
    order: "created_at",
    columns: [
      { key: "created_at", label: "When", format: "date" },
      { key: "event_name", label: "Event" },
      { key: "event_category", label: "Category", format: "badge" },
      { key: "screen_name", label: "Screen" },
      { key: "platform", label: "Platform" },
      { key: "app_version", label: "Version" },
    ],
  },
} as const satisfies Record<string, TableView>;

export type ViewId = keyof typeof TABLE_VIEWS;

export const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/bugs", label: "Bugs" },
  { href: "/feedback", label: "Feedback" },
  { href: "/support", label: "Support" },
  { href: "/sentry", label: "Sentry" },
  { href: "/analytics", label: "Analytics" },
  { href: "/admins", label: "Admins" },
] as const;
