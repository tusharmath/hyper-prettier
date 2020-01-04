/* tslint:disable: no-console no-unbound-method comment-format prefer-template prefer-function-over-method*/

import * as zmq from 'zeromq'

import {Coordinator} from './Coordinator'
import {runZMQ} from './RunZMQ'

const FRONTEND_ADDRESS = 'ipc:///tmp/req-repl-proxy-fe.ipc'
const BACKEND_ADDRESS = 'ipc:///tmp/req-repl-proxy-be.ipc'

const delay = async (n: number) => new Promise(res => setTimeout(res, n))

const request = async (msg: string) => {
  console.log('REQ', msg)
  const masterSocketSend = new zmq.Request()
  masterSocketSend.connect(FRONTEND_ADDRESS)

  await masterSocketSend.send(msg)

  const result = await masterSocketSend.receive()

  masterSocketSend.close()
  console.log('RES', result.toString())

  return result.toString()
}

class MainProcess extends Coordinator {
  private readonly backEnd = new zmq.Dealer()
  private readonly frontEnd = new zmq.Router()
  private readonly proxy = new zmq.Proxy(this.frontEnd, this.backEnd)

  public async init(): Promise<void> {
    // Server
    await this.frontEnd.bind(FRONTEND_ADDRESS)
    await this.backEnd.bind(BACKEND_ADDRESS)
    await this.coordinate()

    // tslint:disable-next-line: no-floating-promises
    this.proxy.run()

    const result = await Promise.all(
      Array.from({length: 20}).map((_, i) => request('HI_' + i.toString()))
    )

    console.log(result)

    this.dispose()
  }

  private dispose() {
    this.proxy.terminate()

    // await this.frontEnd.unbind(FRONTEND_ADDRESS)
    // await this.backEnd.unbind(BACKEND_ADDRESS)
    this.workers?.forEach(_ => {
      _.kill('SIGTERM')
    })
  }
}

class WorkerProcess extends Coordinator {
  public async init(): Promise<void> {
    // S E R V E R
    const ID = process.env.WORKER_ID
    const workerSocketRecv = new zmq.Reply()
    const addr = BACKEND_ADDRESS
    workerSocketRecv.connect(addr)
    await this.coordinate()

    while (true) {
      const buffer = await workerSocketRecv.receive()

      const msg = buffer.toString()

      await delay(1000)
      await workerSocketRecv.send(
        `${Number(msg.split('_')[1]) * 1000} from:${ID}`
      )
    }
  }
}

// BOOTSTRAP
runZMQ(
  () => new MainProcess().init(),
  () => new WorkerProcess().init()
).catch(err => {
  console.error(err)
  process.exit(1)
})
