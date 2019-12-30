import {Managed, QIO} from '@qio/core'

import {createChunks} from './CreateChunks'
import {EnvForker, EnvMasterSocket} from './Env'
import {logger} from './Logger'
import {QWorker} from './QWorker'
import {repeat} from './Repeat'

// Constants
export const WORKER_ID_ENV = 'WORKER_ID'
export const IPC_ADDRESS = 'ipc:///tmp/sock.ipc'
const log = logger('MasterProgram')

// Env Helpers
const masterSocket = QIO.accessM((_: EnvMasterSocket) =>
  _.cluster.masterSocket()
)
const worker = (i: number) =>
  QIO.access((_: EnvForker) => _.cluster.fork({[WORKER_ID_ENV]: i}))

// Sockets
const mMasterSocket = Managed.make(
  masterSocket
    .chain(S => S.bind(IPC_ADDRESS).const(S))
    .do(log('socket', 'ACQUIRED')),
  s => s.close.do(log('socket', 'RELEASED'))
)

// Managed Resources
const mWorker = (i: number) =>
  Managed.make(
    worker(i).do(log('process', 'FORK')),
    QIO.encase((w: QWorker) => {
      w.kill()
    })
  )

export const masterProgram = (filePaths: string[], concurrency: number) =>
  log('program', 'START')
    .and(log('concurrency', concurrency.toString()))
    .and(
      Managed.zip(repeat(concurrency, mWorker)).use_(
        log(`worker pool`, `${concurrency} OK`).and(
          mMasterSocket.use(S =>
            log(`file count`, `${filePaths.length}`)
              .and(
                QIO.seq(
                  createChunks(filePaths, concurrency).map(data =>
                    QIO.if(
                      data.length > 0,
                      S.send(data.join('\n')).and(
                        log(`sent`, `${data.join(',')}`)
                      ),
                      QIO.void()
                    )
                  )
                )
              )
              .and(log(`sent count`, `${filePaths.length}`))
          )
        )
      )
    )
    .catch(err => log('error', err.message)).void
