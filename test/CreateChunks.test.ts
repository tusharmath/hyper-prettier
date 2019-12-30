import {assert} from 'chai'

import {createChunks} from '../src/CreateChunks'

describe('createChunks', () => {
  const createMockChunks = (n: number, c: number) => {
    const array = Array.from({length: n}).map((_, i) => i + 1)

    return createChunks(array, c)
  }

  const spec = (n: number, c: number, expected: number[][]) => {
    it(`should produce chunks ${n}, ${c}`, () => {
      assert.deepStrictEqual(createMockChunks(n, c), expected)
    })
  }

  spec(6, 2, [
    [1, 2, 3],
    [4, 5, 6]
  ])

  spec(7, 2, [
    [1, 2, 3],
    [4, 5, 6, 7]
  ])

  spec(9, 2, [
    [1, 2, 3, 4],
    [5, 6, 7, 8, 9]
  ])

  spec(5, 3, [[1], [2, 3], [4, 5]])
  spec(7, 5, [[1], [2], [3], [4, 5], [6, 7]])

  spec(11, 5, [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10, 11]
  ])

  spec(9, 5, [[1], [2, 3], [4, 5], [6, 7], [8, 9]])
})
