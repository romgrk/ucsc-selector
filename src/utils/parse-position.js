/*
 * parse-position.js
 */

export default function parsePosition(position) {
  const [chrom, range] = position.split(':')
  const [start, end] = range.split('-').map(n => parseInt(n, 10))
  return { chrom, start, end }
}
