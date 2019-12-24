import {Managed, QIO} from '@qio/core'
import {Stream} from '@qio/stream'

import {D} from './Debug'
import {EnvFormatter, EnvWorkerSocket} from './Env'

// Constants
const IPC_ADDRESS = 'ipc:///tmp/sock.ipc'
const DW = (msg: string, action: string) =>
  D('.', `${msg}:`.padEnd(20, ' '), action.toUpperCase())

// Env Helpers
const workerSocket = QIO.accessM((_: EnvWorkerSocket) =>
  _.cluster.workerSocket()
)
const format = (path: string) =>
  QIO.accessM((_: EnvFormatter) => _.formatter.format(path))

const mWorkerSocket = Managed.make(
  workerSocket
    .chain(S => S.connect(IPC_ADDRESS).const(S))
    .do(DW('socket', 'ACQUIRED')),
  s => s.close.do(DW('socket', 'RELEASED'))
)

export const workerProgram = () =>
  DW('program', 'START')
    .and(
      mWorkerSocket.use(
        S =>
          Stream.produce(S.receive).mapM(buffer =>
            format(buffer.toString()).and(DW('data', buffer.toString()))
          ).drain
      )
    )
    .catch(err => DW('error', err.message))
