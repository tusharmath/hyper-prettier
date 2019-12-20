import {QIO} from '@qio/core'

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

export interface EnvFSOpen {
  fs: {
    open(path: string, mode: string): QIO<number, NodeJS.ErrnoException>
  }
}

export interface EnvFSClose {
  fs: {
    close(fd: number): QIO<void, NodeJS.ErrnoException>
  }
}

export interface EnvFSWriteFile {
  fs: {
    writeFile(fd: number, content: Buffer): QIO<void, NodeJS.ErrnoException>
  }
}

export interface EnvFSReadFile {
  fs: {
    readFile(fd: number): QIO<Buffer, NodeJS.ErrnoException>
  }
}
