export function canInteract(world, object) {
  if (!object) return false;
  const dx = world.avatar.x - object.x;
  const dy = world.avatar.y - object.y;
  return Math.hypot(dx, dy) <= object.r + 26;
}

export function moveAvatar(world, dx, dy, width, height, speed = 3.2) {
  const length = Math.hypot(dx, dy) || 1;
  world.avatar.x = Math.max(45, Math.min(width - 45, world.avatar.x + dx / length * speed));
  world.avatar.y = Math.max(75, Math.min(height - 45, world.avatar.y + dy / length * speed));
}
