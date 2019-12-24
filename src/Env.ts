import {Managed, QIO} from '@qio/core'
import {Stream} from '@qio/stream'

import {MasterSocket} from './QMasterSocket'
import {QWorker} from './QWorker'
import {WorkerSocket} from './QWorkerSocket'

// Environments

export interface EnvCPU {
  cpus(): number
}

export interface EnvMasterSocket {
  cluster: {
    masterSocket(): QIO<MasterSocket>
  }
}

export interface EnvWorkerSocket {
  cluster: {
    workerSocket(): QIO<WorkerSocket>
  }
}

export interface EnvForker {
  cluster: {
    fork(): QWorker
  }
}

export interface EnvLogger {
  logger: {
    log(scope: string): (...t: unknown[]) => void
  }
}

export interface EnvMaster {
  cluster: {
    isMaster: boolean
  }
}

export interface EnvMasterProgram {
  masterProgram(filePaths: string[], concurrency: number): QIO<void>
}

export interface EnvWorkerProgram {
  workerProgram(): QIO<void>
}

export interface EnvFormatter {
  formatter: {
    format(path: string): QIO<void, NodeJS.ErrnoException>
  }
}

export interface EnvStdin {
  stdin: {
    data: QIO<Managed<Stream<Buffer>>>
  }
}
