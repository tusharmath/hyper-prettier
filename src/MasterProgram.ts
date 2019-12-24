import {Managed, QIO} from '@qio/core'

import {D} from './Debug'
import {EnvForker, EnvMasterSocket} from './Env'
import {QWorker} from './QWorker'
import {repeat} from './Repeat'

// Constants
const IPC_ADDRESS = 'ipc:///tmp/sock.ipc'
const DM = (msg: string, action: string) =>
  D('*', `${msg}:`.padEnd(20, ' '), action.toUpperCase())

// Env Helpers
const masterSocket = QIO.accessM((_: EnvMasterSocket) =>
  _.cluster.masterSocket()
)
const worker = QIO.access((_: EnvForker) => _.cluster.fork())

// Sockets
const mMasterSocket = Managed.make(
  masterSocket
    .chain(S => S.bind(IPC_ADDRESS).const(S))
    .do(DM('socket', 'ACQUIRED')),
  s => s.close.do(DM('socket', 'RELEASED'))
)

// Managed Resources
const mWorker = Managed.make(
  worker.do(DM('process', 'FORK')),
  QIO.encase((w: QWorker) => {
    w.kill()
  })
)

export const masterProgram = (filePaths: string[], concurrency: number) =>
  DM('program', 'START')
    .and(DM('concurrency', concurrency.toString()))
    .and(
      Managed.zip(repeat(concurrency, () => mWorker)).use_(
        DM(`worker pool`, `${concurrency} OK`).and(
          mMasterSocket.use(S =>
            DM(`file count`, `${filePaths.length}`)
              .and(
                QIO.seq(
                  filePaths.map(file => S.send(file).and(DM(`send`, `${file}`)))
                )
              )
              .and(DM(`file sent`, `${filePaths.length}`))
          )
        )
      )
    )
    .catch(err => DM('error', err.message)).void
