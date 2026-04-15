import Table from 'cli-table3'

// strip emoji characters
function stripEmoji(text: string): string {
  return text.replace(
    /[\u{1F300}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FEFF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu,
    ''
  )
}

function parseMarkdownTable(lines: string[]): string | null {
  // need at least header + separator + one data row
  if (lines.length < 3) return null

  const parseCells = (line: string) =>
    line.split('|').map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)

  const isSeparator = (line: string) => /^\|[-:| ]+\|$/.test(line.trim())

  const header = parseCells(lines[0])
  if (!header.length) return null
  if (!isSeparator(lines[1])) return null

  const rows = lines.slice(2).map(parseCells).filter((r) => r.length > 0)
  if (!rows.length) return null

  const table = new Table({
    head: header,
    style: { head: ['cyan'], border: ['dim'] },
  })
  for (const row of rows) {
    table.push(row)
  }
  return table.toString()
}

export function formatAgentResponse(text: string): string {
  const lines = text.split('\n')
  const output: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // detect markdown table block
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const rendered = parseMarkdownTable(tableLines)
      if (rendered) {
        output.push(rendered)
      } else {
        // fallback: strip pipes and emit plain
        for (const tl of tableLines) {
          output.push(cleanLine(tl))
        }
      }
      continue
    }

    output.push(cleanLine(line))
    i++
  }

  return output.join('\n')
}

function cleanLine(line: string): string {
  let s = line
  s = stripEmoji(s)
  // remove heading markers
  s = s.replace(/^#{1,6}\s+/, '')
  // remove bold/italic markers
  s = s.replace(/\*\*(.+?)\*\*/g, '$1')
  s = s.replace(/\*(.+?)\*/g, '$1')
  s = s.replace(/__(.+?)__/g, '$1')
  s = s.replace(/_(.+?)_/g, '$1')
  // remove inline code backticks (keep content)
  s = s.replace(/`([^`]+)`/g, '$1')
  return s
}
