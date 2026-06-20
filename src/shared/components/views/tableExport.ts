export function exportCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename: string
) {
  const csvContent = [
    columns.map(c => `"${c.label}"`).join(','),
    ...data.map(row =>
      columns.map(c => {
        const val = row[c.key];
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportPDF(title: string) {
  const printWin = window.open('', '_blank');
  if (!printWin) return;
  const styles = Array.from(document.styleSheets)
    .map(s => {
      try {
        return Array.from(s.cssRules || []).map(r => r.cssText).join('\n');
      } catch { return ''; }
    })
    .join('\n');

  printWin.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>${styles}</style>
        <style>
          @media print {
            body { padding: 20px; }
            .table-toolbar, .sidebar, .header, .no-print { display: none !important; }
            @page { margin: 15mm; }
          }
        </style>
      </head>
      <body>${document.querySelector('.content-area')?.innerHTML || document.body.innerHTML}</body>
    </html>
  `);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => printWin.print(), 500);
}
