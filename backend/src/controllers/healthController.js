/** GET /api/health */
export function health(req, res) {
  res.json({ status: 'ok' });
}