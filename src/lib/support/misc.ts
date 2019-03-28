export function randomChoice<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomSample<T>(items: T[], count: number): T[] {
  if (count >= items.length) {
    return items;
  }

  let indexes: number[] = [];
  for (let i = 0; i < items.length; i++) {
    indexes.push(i);
  }

  let values: T[] = [];
  for (let i = 0; i < count; i++) {
    let index = indexes.splice(Math.floor(Math.random() * indexes.length), 1)[0];
    values.push(items[index]);
  }

  return values;
}
