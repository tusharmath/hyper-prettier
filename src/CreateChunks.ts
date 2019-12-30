/* tslint:disable: increment-decrement */

const split = (min: number, max: number, count: number, expected: number) => {
  for (let i = 0; i < count; i++) {
    if (i * min + (count - i) * max === expected) {
      return i
    }
  }

  return count
}

const createChunkCapacity = (
  count: number,
  minSize: number,
  maxSize: number,
  distribution: number
) => {
  const chunks = new Array()
  for (let i = 0; i < count; i++) {
    chunks.push(i < distribution ? minSize : maxSize)
  }

  return chunks
}

export const createChunks = <A>(arr: A[], chunkCount: number): A[][] => {
  const itemCount = arr.length
  const chunks = new Array<A[]>([])
  const minChunkSize = Math.floor(arr.length / chunkCount)
  const maxChunkSize = minChunkSize + 1
  const distribution = split(minChunkSize, maxChunkSize, chunkCount, itemCount)
  const chunkCapacity = createChunkCapacity(
    chunkCount,
    minChunkSize,
    maxChunkSize,
    distribution
  )

  let selectedChunk = 0

  for (let i = 0; i < itemCount; i++) {
    if (chunks[selectedChunk].length === chunkCapacity[selectedChunk]) {
      selectedChunk++
      chunks.push([])
    }
    chunks[selectedChunk].push(arr[i])
  }

  return chunks
}
