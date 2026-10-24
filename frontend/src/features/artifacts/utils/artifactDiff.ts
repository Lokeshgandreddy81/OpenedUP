export interface ArtifactDiffLine {
  kind: "same" | "added" | "removed";
  text: string;
}

export interface ArtifactDiff {
  lines: ArtifactDiffLine[];
  tooLarge: boolean;
}

const MAX_DIFF_LINES = 1_200;

export function diffArtifactContent(before: string, after: string): ArtifactDiff {
  const oldLines = before.split("\n");
  const newLines = after.split("\n");
  if (oldLines.length + newLines.length > MAX_DIFF_LINES * 2) {
    return { lines: [], tooLarge: true };
  }

  const rows = oldLines.length + 1;
  const columns = newLines.length + 1;
  const lcs = Array.from({ length: rows }, () => new Uint16Array(columns));
  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    const row = lcs[oldIndex]!;
    const nextRow = lcs[oldIndex + 1]!;
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      row[newIndex] =
        oldLines[oldIndex] === newLines[newIndex]
          ? nextRow[newIndex + 1]! + 1
          : Math.max(nextRow[newIndex]!, row[newIndex + 1]!);
    }
  }

  const lines: ArtifactDiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length && newIndex < newLines.length) {
    if (oldLines[oldIndex] === newLines[newIndex]) {
      lines.push({ kind: "same", text: oldLines[oldIndex]! });
      oldIndex += 1;
      newIndex += 1;
    } else if (lcs[oldIndex + 1]![newIndex]! >= lcs[oldIndex]![newIndex + 1]!) {
      lines.push({ kind: "removed", text: oldLines[oldIndex++]! });
    } else {
      lines.push({ kind: "added", text: newLines[newIndex++]! });
    }
  }
  while (oldIndex < oldLines.length) lines.push({ kind: "removed", text: oldLines[oldIndex++]! });
  while (newIndex < newLines.length) lines.push({ kind: "added", text: newLines[newIndex++]! });
  return { lines, tooLarge: false };
}
