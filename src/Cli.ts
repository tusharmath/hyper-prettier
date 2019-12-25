import {defaultRuntime, Managed, QIO} from '@qio/core'
import {FSEnv} from '@qio/fs'
import {Stream} from '@qio/stream'
import * as cl from 'cluster'
import debug from 'debug'
import * as p from 'path'

import {format} from './Formatter'
import {masterProgram, WORKER_ID_ENV} from './MasterProgram'
import {program} from './Program'
import {QMasterSocket} from './QMasterSocket'
import {QWorkerSocket} from './QWorkerSocket'
import {workerProgram} from './WorkerProgram'

const workerId = QIO.lift(() => {
  const env = Number(process.env[WORKER_ID_ENV])

  return Number.isFinite(env) ? Number(env) : 100
})
defaultRuntime().unsafeExecute(
  program(2).provide({
    cluster: {isMaster: cl.isMaster},
    masterProgram: QIO.pipeEnv(masterProgram, {
      cluster: {
        fork: env => cl.fork(env),
        masterSocket: QMasterSocket.of
      },
      logger: {log: debug},
      worker: {
        id: workerId
      }
    }),
    stdin: {
      data: QIO.resolve(
        Managed.make(
          QIO.resolve(
            Stream.of(
              Buffer.from(
                [
                  p.resolve(
                    process.cwd(),
                    '../mobile-web-dream11',
                    'd11-chai/does-not-contain-action.test.ts'
                  ),
                  p.resolve(
                    process.cwd(),
                    '../mobile-web-dream11',
                    'd11-chai/does-not-trigger-action.ts'
                  ),
                  p.resolve(
                    process.cwd(),
                    '../mobile-web-dream11',
                    'd11-chai/has-action.ts'
                  )
                ].join('\n')
              )
            )
          ),
          QIO.void
        )
      )
    },
    workerProgram: QIO.pipeEnv(workerProgram, {
      cluster: {
        workerSocket: QWorkerSocket.of
      },
      formatter: {
        format: QIO.pipeEnv(format, {
          fs: FSEnv,
          logger: {log: debug},
          worker: {
            id: workerId
          }
        })
      },
      logger: {log: debug},
      worker: {
        id: workerId
      }
    })
  }),
  // tslint:disable-next-line: no-unbound-method no-console
  console.log
)
