export function getLatestOrderState(data: any) {
  if (Array.isArray(data)) {
    return data.length > 0 ? data[data.length - 1] : null;
  }
  return data || null;
}
