// Other Helper
export const repeat = <A>(count: number, fn: (i: number) => A): A[] => {
  const result = new Array<A>()
  for (let i = 0; i < count; i = i + 1) {
    result.push(fn(i))
  }

  return result
}
