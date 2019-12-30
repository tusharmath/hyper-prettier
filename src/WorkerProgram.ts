import {Managed, QIO} from '@qio/core'
import {Stream} from '@qio/stream'

import {EnvFormatter, EnvWorkerSocket} from './Env'
import {logger} from './Logger'
import {IPC_ADDRESS} from './MasterProgram'

const log = logger('WorkerProgram')

// Env Helpers
const workerSocket = QIO.accessM((_: EnvWorkerSocket) =>
  _.cluster.workerSocket()
)
export const format = (path: string) =>
  QIO.accessM((_: EnvFormatter) => _.formatter.format(path))

const mWorkerSocket = Managed.make(
  workerSocket
    .chain(S => S.connect(IPC_ADDRESS).const(S))
    .do(log('socket', 'ACQUIRED')),
  s => s.close.do(log('socket', 'RELEASED'))
)

export const workerProgram = () =>
  log('program', 'START')
    .and(
      mWorkerSocket.use(
        S =>
          Stream.produce(S.receive).mapM(buffer => {
            const filePaths = buffer.toString().split('\n')

            return log('recv', filePaths.join(',')).and(
              QIO.par(filePaths.map(format))
                .and(log('format', `${filePaths.join(',')} OK`))
                .and(S.send('1'))
            )
          }).drain
      )
    )
    .catch(err => log('ERROR', err.message))
