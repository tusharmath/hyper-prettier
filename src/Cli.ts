import {defaultRuntime, QIO} from '@qio/core'
import {FSEnv} from '@qio/fs'
import * as cl from 'cluster'
import debug from 'debug'

import {format} from './Formatter'
import {onMaster, onWorker, program} from './HPrettier'
import {QMasterSocket} from './QMasterSocket'
import {QWorkerSocket} from './QWorkerSocket'

defaultRuntime().unsafeExecute(
  program(['A', 'B', 'C', 'D', 'E'], 2).provide({
    cluster: {isMaster: cl.isMaster},
    masterProgram: QIO.pipeEnv(onMaster, {
      cluster: {
        fork: () => cl.fork(),
        masterSocket: QMasterSocket.of
      },
      logger: {log: debug}
    }),
    workerProgram: QIO.pipeEnv(onWorker, {
      cluster: {
        workerSocket: QWorkerSocket.of
      },
      formatter: {
        format: QIO.pipeEnv(format, {
          fs: FSEnv
        })
      },
      logger: {log: debug}
    })
  })
)
