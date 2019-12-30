import {QIO, Ref} from '@qio/core'
import {Stream} from '@qio/stream'

// tslint:disable-next-line: invalid-void
const end = QIO.uninterruptible<void>(res => process.stdin.on('end', res))
const src = Stream.fromEventEmitter<string>(process.stdin, 'data')

export const getFilePaths = Ref.of('')
  .chain(ref =>
    src
      .forEach(_ => ref.update(s => s + _))
      .fork()
      .chain(F => end.and(F.abort).and(ref.read))
  )
  .map(_ => _.split('\n'))
