import {defaultRuntime, Exit, QIO} from '@qio/core'
import * as cl from 'cluster'
import debug from 'debug'

import {onMaster, onWorker, program} from './HPrettier'
import {QMasterSocket} from './QMasterSocket'
import {QWorkerSocket} from './QWorkerSocket'

const onComplete = <A, E>(cb: Exit<A, E>) => {
  if (cb.tag === Exit.CANCELLED) {
    // tslint:disable-next-line: no-use-before-declare
    cancellation.cancel()
  }
}

const cancellation = defaultRuntime().unsafeExecute(
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
      logger: {log: debug}
    })
  }),
  onComplete
)
