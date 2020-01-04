/* tslint:disable: no-console no-unbound-method comment-format prefer-template*/

import * as c from 'cluster'
import * as os from 'os'
import * as zmq from 'zeromq'

const ADDRESS = 'ipc:///tmp/sock-req-rep.ipc'

const delay = async (n: number) => new Promise(res => setTimeout(res, n))

const main = async () => {
  if (c.isMaster) {
    const masterSocketSend = new zmq.Push()
    // Await masterSocketSend.bind(ADDRESS_PREFIX)

    os.cpus().map((_, i) => {
      const ID = i + 1
      c.fork({WORKER_ID: ID})
    })

    const addr = ADDRESS
    await masterSocketSend.bind(addr)
    console.log('bind', addr)

    const itar = async (msg: string, n: number): Promise<void> => {
      if (n === 0) {
        return
      }

      const msgFinal = `HI_${n.toString()}`

      await masterSocketSend.send(msgFinal)
      // console.log('SEND', msgFinal)
      // const result = await masterSocketSend.receive()
      // console.log(result.toString())

      return itar(msg, n - 1)
    }
    await delay(100)
    await itar('HI', 100)
  }

  if (c.isWorker) {
    // S E R V E R

    const workerSocketRecv = new zmq.Pull()
    const addr = `${ADDRESS}`
    workerSocketRecv.connect(addr)
    console.log('connect', addr)

    while (true) {
      const buffer = await workerSocketRecv.receive()

      const msg = buffer.toString()
      console.log('RECV', msg)

      // await delay(1_000)
      // await workerSocketRecv.send(`${msg.split('_')[1]} from:${ID}`)
    }
  }
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
