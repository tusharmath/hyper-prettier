import {QIO} from '@qio/core'
import * as mq from 'zeromq'

export interface MasterSocket {
  close: QIO<void>
  bind(address: string): QIO<void, Error>
  send(message: string): QIO<void, Error>
}

export class QMasterSocket implements MasterSocket {
  public static of() {
    return QIO.lift(() => new QMasterSocket())
  }

  private readonly socket = new mq.Push()
  public bind(address: string): QIO<void, Error> {
    return QIO.tryP(() => this.socket.bind(address))
  }
  public get close() {
    return QIO.lift(() => {
      this.socket.close()
    })
  }
  public send(message: string) {
    return QIO.tryP(() => this.socket.send(message))
  }
}
