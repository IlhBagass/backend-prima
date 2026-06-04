const escapeCsv = (value) => {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

export const rowsToCsv = (rows = []) => {
  if (!Array.isArray(rows) || rows.length === 0) return "";

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row || {}).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );

  const lines = [];
  lines.push(headers.map(escapeCsv).join(","));

  for (const row of rows) {
    const values = headers.map((h) => escapeCsv(row?.[h]));
    lines.push(values.join(","));
  }

  return lines.join("\r\n");
};

