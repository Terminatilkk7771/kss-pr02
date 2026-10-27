import type { Priority, Ticket, TicketStatus } from "./models";

export const STATUS_TRANSITIONS: Readonly<Record<TicketStatus, readonly TicketStatus[]>> = {
  open: ["in_progress", "closed"],
  in_progress: ["open", "resolved"],
  resolved: ["closed", "in_progress"],
  closed: [],
};

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}

export function changeStatus(ticket: Ticket, to: TicketStatus): Ticket {
  if (!canTransition(ticket.status, to)) {
    throw new Error(`Недопустимий перехід: ${ticket.status} → ${to}`);
  }
  return {
    ...ticket,
    status: to,
    tags: [...ticket.tags],
  };
}

function assertNever(value: never): never {
  throw new Error(`Невідомий пріоритет: ${String(value)}`);
}

export function priorityWeight(priority: Priority): number {
  switch (priority) {
    case "low":
      return 1;
    case "medium":
      return 2;
    case "high":
      return 3;
    case "critical":
      return 4;
    default:
      return assertNever(priority);
  }
}

function isTicketStatus(value: unknown): value is TicketStatus {
  return (
    value === "open" ||
    value === "in_progress" ||
    value === "resolved" ||
    value === "closed"
  );
}

function isPriority(value: unknown): value is Priority {
  return (
    value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "critical"
  );
}

export function isTicket(value: unknown): value is Ticket {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  if (
    !("id" in value) ||
    !("title" in value) ||
    !("status" in value) ||
    !("priority" in value) ||
    !("authorId" in value) ||
    !("assigneeId" in value) ||
    !("createdAt" in value) ||
    !("tags" in value)
  ) {
    return false;
  }
  if (typeof value.id !== "number" || !Number.isFinite(value.id)) {
    return false;
  }
  if (typeof value.title !== "string" || value.title.trim().length === 0) {
    return false;
  }
  if ("description" in value && value.description !== undefined && typeof value.description !== "string") {
    return false;
  }
  if (!isTicketStatus(value.status)) {
    return false;
  }
  if (!isPriority(value.priority)) {
    return false;
  }
  if (typeof value.authorId !== "number" || !Number.isFinite(value.authorId)) {
    return false;
  }
  if (value.assigneeId !== null && (typeof value.assigneeId !== "number" || !Number.isFinite(value.assigneeId))) {
    return false;
  }
  if (typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt))) {
    return false;
  }
  if (!Array.isArray(value.tags) || !value.tags.every((tag): tag is string => typeof tag === "string")) {
    return false;
  }
  return true;
}

export function parseTickets(json: string): Ticket[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    throw new Error("Очікувався масив заявок");
  }
  const tickets: Ticket[] = [];
  for (let i = 0; i < parsed.length; i += 1) {
    const item: unknown = parsed[i];
    if (!isTicket(item)) {
      throw new Error(`Некоректна заявка з індексом ${i}`);
    }
    tickets.push(item);
  }
  return tickets;
}

export function firstTitle(tickets: readonly Ticket[]): string {
  return tickets[0]?.title ?? "Заявок немає";
}
