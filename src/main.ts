import { readFileSync } from "node:fs";
import { join } from "node:path";
import { groupBy, paginate } from "./collections";
import { CreateTicketInput } from "./dto/create-ticket.input";
import { formatTicket, summarize } from "./legacy/report";
import { LoggedTicketRepository } from "./log-call";
import type { Ticket } from "./models";
import { InMemoryRepository } from "./repository";
import { firstTitle, parseTickets, priorityWeight } from "./tickets";
import { validate } from "./validation";

function main(): void {
  const filePath = join(__dirname, "..", "data", "tickets.json");
  const rawJson = readFileSync(filePath, "utf-8");
  const loadedTickets = parseTickets(rawJson);

  const repo = new InMemoryRepository<Ticket>(loadedTickets);

  console.log("=== 1. Відкриті заявки за спаданням пріоритету ===");
  const openTickets = repo
    .findAll({ status: "open" })
    .sort((a, b) => priorityWeight(b.priority) - priorityWeight(a.priority));
  for (const ticket of openTickets) {
    console.log(" ", formatTicket(ticket));
  }

  console.log("\n=== 2. Кількість заявок за станами ===");
  const countsByStatus = summarize(repo.findAll());
  const groupedByStatus = groupBy(repo.findAll(), (t) => t.status);
  console.log("  Зведення summarize():", countsByStatus);
  console.log(
    "  Групи groupBy():",
    Object.fromEntries(
      Object.entries(groupedByStatus).map(([status, list]) => [status, list?.length ?? 0]),
    ),
  );

  console.log("\n=== 3. Друга сторінка списку заявок (по 4 на сторінку) ===");
  const secondPage = paginate(repo.findAll(), 2, 4);
  console.log(
    `  Сторінка ${secondPage.page} із ${secondPage.totalPages} (всього заявок: ${secondPage.total}):`,
  );
  for (const ticket of secondPage.items) {
    console.log(" ", formatTicket(ticket));
  }

  console.log("\n=== 4. Валідація некоректних вхідних даних DTO ===");
  const invalidInput = CreateTicketInput.from({
    title: "   ",
    description: "x".repeat(505),
    priority: "urgent",
  });
  const validationErrors = validate(invalidInput);
  for (const errText of validationErrors) {
    console.log("  -", errText);
  }

  console.log("\n=== 5. Додаткові завдання (@LogCall та firstTitle) ===");
  const loggedRepo = new LoggedTicketRepository(loadedTickets);
  const updateResult = loggedRepo.update(1, { priority: "critical" });
  if (updateResult.ok) {
    console.log("  Оновлено заявку:", formatTicket(updateResult.value));
  }
  console.log("  Перша заявка у списку:", firstTitle(loadedTickets));
  console.log("  Порожній список firstTitle([]):", firstTitle([]));
}

main();
