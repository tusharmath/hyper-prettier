import {QIO} from '@qio/core'
import * as mq from 'zeromq'

export interface WorkerSocket {
  close: QIO<void>
  receive: QIO<Buffer[], Error>
  connect(address: string): QIO<void>
}

export class QWorkerSocket implements WorkerSocket {
  public static of(): QIO<QWorkerSocket> {
    return QIO.lift(() => new QWorkerSocket())
  }

  private readonly socket = new mq.Pull()

  public get close() {
    return QIO.lift(() => {
      this.socket.close()
    })
  }

  public connect(address: string) {
    return QIO.lift(() => {
      this.socket.connect(address)
    })
  }

  public get receive() {
    return QIO.tryP(() => this.socket.receive())
  }
}
