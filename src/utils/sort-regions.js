/*
 * sort-regions.js
 */

import parsePosition from './parse-position.js'

export default function sortRegions(regions) {
  return regions.sort((a, b) => {
    const pa = parsePosition(a.position)
    const pb = parsePosition(b.position)

    const ca = parseInt(pa.chrom.replace(/\D/g, ''))
    const cb = parseInt(pb.chrom.replace(/\D/g, ''))

    if (ca < cb)
      return -1
    if (ca > cb)
      return +1
    if (pa.start < pb.start)
      return -1
    if (pa.start > pb.start)
      return +1
    if (pa.end < pb.end)
      return -1
    if (pa.end > pb.end)
      return +1
    return 0
  })
}
