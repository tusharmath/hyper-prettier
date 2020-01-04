/* tslint:disable */

import * as c from 'cluster'
import * as zmq from 'zeromq'
import * as os from 'os'

const ADDRESS =
  'inproc:///' + Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

const delay = (n: number) => new Promise(res => setTimeout(res, n))

const main = async () => {
  if (c.isMaster) {
    console.log('ADDRESS', ADDRESS)
    const masterSocketSend = new zmq.Dealer()
    console.log(masterSocketSend.context.ioThreads)

    await Promise.all(
      os.cpus().map(async (_, i) => {
        const ID = i + 1
        c.fork({WORKER_ID: ID})
      })
    )
    await masterSocketSend.connect(ADDRESS)
    const itar = async (msg: string, n: number): Promise<void> => {
      if (n === 0) return
      await masterSocketSend.send('HI_' + n)
      await masterSocketSend.receive().then(R => {
        console.log('RECV', msg, R.toString())
      })

      itar(msg, n - 1)
    }
    await itar('HI', 100)
  }

  if (c.isWorker) {
    // const ID = process.env.WORKER_ID

    const workerSocketRecv = new zmq.Push()
    await workerSocketRecv.bind(ADDRESS)

    while (true) {
      // const buffer = await workerSocketRecv.receive()
      // const msg = buffer[1].toString()
      // console.log(msg)

      await delay(1_000 * Math.random())
      await workerSocketRecv.send('YO')
    }
  }
}

main().catch(console.log)

// async function poll(
//   masterSocketRecv: zmq.Pull,
//   CB_SET: Map<number, (A: unknown) => void>
// ) {
//   while (true) {
//     const buffer = await masterSocketRecv.receive()

//     const {msg, asyncId} = JSON.parse(buffer.toString())
//     console.log(msg, asyncId)
//     const cb = CB_SET.get(asyncId)
//     if (cb) {
//       CB_SET.delete(asyncId)
//       cb(msg)
//     }
//   }
// }
