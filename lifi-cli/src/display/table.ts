import Table from 'cli-table3'

export function makeTable(head: string[], rows: string[][]): string {
  const table = new Table({ head, style: { head: ['cyan'] } })
  rows.forEach((row) => table.push(row))
  return table.toString()
}
