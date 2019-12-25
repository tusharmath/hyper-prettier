import {defaultRuntime, QIO} from '@qio/core'
import {FSEnv} from '@qio/fs'
import {Stream} from '@qio/stream'
import * as cl from 'cluster'
import debug from 'debug'

import {format} from './Formatter'
import {masterProgram} from './MasterProgram'
import {program} from './Program'
import {QMasterSocket} from './QMasterSocket'
import {QWorkerSocket} from './QWorkerSocket'
import {workerId} from './WorkerId'
import {workerProgram} from './WorkerProgram'

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
      data: Stream.fromEventEmitter(process, 'data')
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
