/* tslint:disable: no-console no-unbound-method comment-format prefer-template*/

import * as c from 'cluster'
import * as os from 'os'
import * as zmq from 'zeromq'

const ADDRESS = 'ipc:///tmp/sock-req-rep.ipc'
const WORKER_ADDRESSES = new Array<string>()

const delay = async (n: number) => new Promise(res => setTimeout(res, n))
const ctx = new zmq.Context()
const request = async (msg: string) => {
  // console.log('REQ')
  const masterSocketSend = new zmq.Request({context: ctx})

  WORKER_ADDRESSES.forEach(_ => {
    masterSocketSend.connect(_)
  })
  await masterSocketSend.send(msg)

  const result = await masterSocketSend.receive()
  masterSocketSend.close()

  return result
}
const main = async () => {
  if (c.isMaster) {
    // Await masterSocketSend.bind(ADDRESS_PREFIX)

    os.cpus().map((_, i) => {
      const ID = i + 1
      c.fork({WORKER_ID: ID})
      const addr = ADDRESS + '_' + ID.toString()
      WORKER_ADDRESSES.push(addr)
    })

    const itar = (msg: string, n: number): void => {
      if (n === 0) {
        return
      }

      const msgFinal = `HI_${n.toString()}`
      // console.log('SEND', msgFinal)

      // tslint:disable-next-line: no-floating-promises
      request(msgFinal)
      // await masterSocketSend.send(msgFinal)
      // const result = await masterSocketSend.receive()
      // console.log(result.toString())

      itar(msg, n - 1)
    }
    itar('HI', 100)
  }

  if (c.isWorker) {
    // S E R V E R
    const ID = process.env.WORKER_ID

    const workerSocketRecv = new zmq.Reply()
    const addr = `${ADDRESS}_${ID}`
    await workerSocketRecv.bind(addr)
    console.log('bind', addr)

    while (true) {
      const buffer = await workerSocketRecv.receive()

      const msg = buffer.toString()
      console.log('RECV', msg)

      await delay(1_000)
      await workerSocketRecv.send(`${msg.split('_')[1]} from:${ID}`)
    }
  }
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
