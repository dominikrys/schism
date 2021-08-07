const world_str = 'world';

export function hello(world: string = world_str): string {
  return `Hello ${world}! `;
}
