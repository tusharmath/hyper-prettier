import {Managed, QIO} from '@qio/core'
import {Stream} from '@qio/stream'

import {D} from './Debug'
import {
  EnvForker,
  EnvFormatter,
  EnvMaster,
  EnvMasterProgram,
  EnvMasterSocket,
  EnvWorkerProgram,
  EnvWorkerSocket
} from './Env'
import {QWorker} from './QWorker'
import {repeat} from './Repeat'

// Constants
const IPC_ADDRESS = 'ipc:///tmp/sock.ipc'
const DM = (msg: string, action: string) =>
  D('*', `${msg}:`.padEnd(20, ' '), action.toUpperCase())
const DW = (msg: string, action: string) =>
  D('.', `${msg}:`.padEnd(20, ' '), action.toUpperCase())

// Env Helpers
const masterSocket = QIO.accessM((_: EnvMasterSocket) =>
  _.cluster.masterSocket()
)
const workerSocket = QIO.accessM((_: EnvWorkerSocket) =>
  _.cluster.workerSocket()
)
const worker = QIO.access((_: EnvForker) => _.cluster.fork())
const isMaster = QIO.access((_: EnvMaster) => _.cluster.isMaster)
const getMasterProgram = (filePaths: string[], concurrency: number) =>
  QIO.accessM((_: EnvMasterProgram) => _.masterProgram(filePaths, concurrency))
const getWorkerProgram = () =>
  QIO.accessM((_: EnvWorkerProgram) => _.workerProgram())
const format = (path: string) =>
  QIO.accessM((_: EnvFormatter) => _.formatter.format(path))

// Sockets
const mMasterSocket = Managed.make(
  masterSocket
    .chain(S => S.bind(IPC_ADDRESS).const(S))
    .do(DM('socket', 'ACQUIRED')),
  s => s.close.do(DM('socket', 'RELEASED'))
)
const mWorkerSocket = Managed.make(
  workerSocket
    .chain(S => S.connect(IPC_ADDRESS).const(S))
    .do(DW('socket', 'ACQUIRED')),
  s => s.close.do(DW('socket', 'RELEASED'))
)

// Managed Resources
const mWorker = Managed.make(
  worker.do(DM('process', 'FORK')),
  QIO.encase((w: QWorker) => {
    w.kill()
  })
)

export const onMaster = (filePaths: string[], concurrency: number) =>
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

export const onWorker = () =>
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

export const program = (filePaths: string[], concurrency: number) =>
  isMaster.chain(cond =>
    QIO.if(cond, getMasterProgram(filePaths, concurrency), getWorkerProgram())
  )
