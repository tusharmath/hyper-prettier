/* tslint:disable: no-console */
import * as c from 'cluster'
import * as zmq from 'zeromq'

import {fork} from './fork'

export abstract class Coordinator {
  protected get workerId(): number {
    const ID = Number(process.env.WORKER_ID)

    return Number.isFinite(ID) ? ID : -1
  }
  protected workers?: c.Worker[]
  private readonly address = 'ipc:///tmp/req-repl-proxy-coord.ipc'
  private readonly masterSocket = new zmq.Reply()
  private readonly workerSocket = new zmq.Request()
  public async coordinate() {
    if (c.isMaster) {
      await this.coordinateMaster()
    } else {
      await this.coordinateWorker()
    }
  }
  public abstract init(): Promise<void>
  private async coordinateMaster() {
    await this.masterSocket.bind(this.address)
    this.workers = fork()

    let connectionCount = 0
    while (connectionCount < this.workers.length) {
      await this.masterSocket.receive()
      await this.masterSocket.send('')
      connectionCount += 1
    }
    console.log(`connected to ${connectionCount} workers`)
    await this.masterSocket.unbind(this.address)
    this.masterSocket.close()
  }
  private async coordinateWorker() {
    this.workerSocket.connect(this.address)
    await this.workerSocket.send('')
    await this.workerSocket.receive()
    this.workerSocket.close()
  }
}
