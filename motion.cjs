// Pure desktop motion: no accessibility permission or global mouse hooks needed.
function step(bounds, cursor, area, dt, enabled) {
  const dx = cursor.x - (bounds.x + bounds.width / 2);
  const dy = cursor.y - (bounds.y + 230);
  const distance = Math.hypot(dx, dy);
  const moving = enabled && distance > 170;
  const travel = Math.min(100 * Math.min(dt, 0.1), Math.max(0, distance - 170));
  const x = Math.round(Math.max(area.x, Math.min(area.x + Math.max(0, area.width - bounds.width), bounds.x + (moving ? dx / distance * travel : 0))));
  const y = Math.round(Math.max(area.y, Math.min(area.y + Math.max(0, area.height - bounds.height), bounds.y + (moving ? dy / distance * travel : 0))));
  return { x, y, walking: moving && (x !== bounds.x || y !== bounds.y), facing: dx > 0 ? 'right' : 'left', near: distance < 170 };
}
module.exports = { step };
