import {defaultRuntime, QIO} from '@qio/core'
import {FSEnv} from '@qio/fs'
import * as cl from 'cluster'
import debug from 'debug'

import {format} from './Formatter'
import {getFilePaths} from './GetFilePaths'
import {masterProgram} from './MasterProgram'
import {program} from './Program'
import {QMasterSocket} from './QMasterSocket'
import {QWorkerSocket} from './QWorkerSocket'
import {workerId} from './WorkerId'
import {workerProgram} from './WorkerProgram'

defaultRuntime().unsafeExecute(
  program(getFilePaths, 2).provide({
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
