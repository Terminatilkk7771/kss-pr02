/**
 * Моделі предметної області «Служба технічної підтримки коледжу».
 */

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type Priority = "low" | "medium" | "high" | "critical";

export type Role = "student" | "teacher" | "admin";

export interface User {
  readonly id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface Ticket {
  readonly id: number;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: Priority;
  authorId: number;
  assigneeId: number | null;
  createdAt: string;
  tags: string[];
}

export type CreateTicketDto = Pick<Ticket, "title" | "priority" | "authorId"> &
  Partial<Pick<Ticket, "description" | "tags">>;

export type UpdateTicketDto = Partial<
  Omit<Ticket, "id" | "status" | "authorId" | "createdAt">
>;
