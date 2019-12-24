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
import {workerProgram} from './WorkerProgram'

defaultRuntime().unsafeExecute(
  program(2).provide({
    cluster: {isMaster: cl.isMaster},
    masterProgram: QIO.pipeEnv(masterProgram, {
      cluster: {
        fork: () => cl.fork(),
        masterSocket: QMasterSocket.of
      },
      logger: {log: debug}
    }),
    stdin: {
      data: Stream.fromEventEmitter<Buffer>(process.stdin, 'data')
    },
    workerProgram: QIO.pipeEnv(workerProgram, {
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
