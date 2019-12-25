import {Stream} from '@qio/stream'
export const getFilePaths = Stream.fromEventEmitter<Buffer>(
  process.stdin,
  'data'
).chain(M =>
  M.use(S => S.map(_ => _.toString()).foldLeft('', (a, b) => a + b)).map(_ =>
    _.split('\n')
  )
)
