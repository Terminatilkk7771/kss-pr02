import { performance } from "node:perf_hooks";
import type { Ticket } from "./models";
import { InMemoryRepository } from "./repository";
import type { Result } from "./result";

export function LogCall() {
  return function <TArgs extends unknown[], TReturn>(
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: TArgs) => TReturn>,
  ): TypedPropertyDescriptor<(...args: TArgs) => TReturn> {
    const originalMethod = descriptor.value;
    if (!originalMethod) {
      return descriptor;
    }
    const methodName = String(propertyKey);

    descriptor.value = function (this: unknown, ...args: TArgs): TReturn {
      const started = performance.now();
      const result = originalMethod.apply(this, args);
      const elapsedMs = (performance.now() - started).toFixed(3);
      const formattedArgs = args.map((arg) => JSON.stringify(arg)).join(", ");
      console.log(`[LogCall] ${methodName}(${formattedArgs}) виконано за ${elapsedMs} мс`);
      return result;
    };

    return descriptor;
  };
}

export class LoggedTicketRepository extends InMemoryRepository<Ticket> {
  @LogCall()
  override update(id: number, patch: Partial<Omit<Ticket, "id">>): Result<Ticket> {
    return super.update(id, patch);
  }
}
