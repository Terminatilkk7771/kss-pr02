type Rule = (value: unknown) => string | null;

const rulesRegistry = new WeakMap<object, Map<string, Rule[]>>();

function addRule(target: object, propertyKey: string | symbol, rule: Rule): void {
  const key = String(propertyKey);
  let propMap = rulesRegistry.get(target);
  if (!propMap) {
    propMap = new Map<string, Rule[]>();
    rulesRegistry.set(target, propMap);
  }
  const existingRules = propMap.get(key);
  if (existingRules) {
    existingRules.unshift(rule);
  } else {
    propMap.set(key, [rule]);
  }
}

export function Required(): PropertyDecorator {
  return (target, propertyKey) =>
    addRule(target, propertyKey, (value) =>
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "")
        ? "поле обов'язкове"
        : null,
    );
}

export function MaxLength(max: number): PropertyDecorator {
  return (target, propertyKey) =>
    addRule(target, propertyKey, (value) =>
      typeof value === "string" && value.length > max
        ? `довжина не більше ${max} символів`
        : null,
    );
}

export function IsIn(allowed: readonly unknown[]): PropertyDecorator {
  return (target, propertyKey) =>
    addRule(target, propertyKey, (value) =>
      value !== undefined && value !== null && !allowed.includes(value)
        ? `допустимі значення: ${allowed.map(String).join(", ")}`
        : null,
    );
}

export function validate(obj: object): string[] {
  const errors: string[] = [];
  const proto: unknown = Object.getPrototypeOf(obj);
  if (typeof proto !== "object" || proto === null) {
    return errors;
  }

  const propMap = rulesRegistry.get(proto);
  if (!propMap) {
    return errors;
  }

  for (const [propName, rules] of propMap.entries()) {
    const value: unknown = Reflect.get(obj, propName);
    for (const rule of rules) {
      const errorMessage = rule(value);
      if (errorMessage !== null) {
        errors.push(`${propName}: ${errorMessage}`);
      }
    }
  }

  return errors;
}
