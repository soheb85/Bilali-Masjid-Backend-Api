/* eslint-disable @typescript-eslint/no-explicit-any */

const IGNORE_FIELDS = ['updatedAt', 'createdAt', '__v', '_id'];

export function getChanges(oldObj: any = {}, newObj: any = {}) {
  const changes: Record<string, any> = {};

  for (const key in newObj) {
    if (IGNORE_FIELDS.includes(key)) continue; // ✅ ignore system fields

    const oldVal = oldObj?.[key];
    const newVal = newObj[key];

    // Deep compare
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

    changes[key] = {
      before: oldVal,
      after: newVal,
    };
  }

  return changes;
}