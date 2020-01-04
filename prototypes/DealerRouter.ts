/* tslint:disable: increment-decrement no-console no-unbound-method comment-format prefer-template*/

import * as c from 'cluster'
import * as os from 'os'
import * as zmq from 'zeromq'

const ADDRESS = 'ipc:///tmp/sock-req-rep.ipc'

// const delay = async (n: number) => new Promise(res => setTimeout(res, n))

const main = async () => {
  // S E R V E R
  if (c.isMaster) {
    const masterSocketSend = new zmq.Router()
    await masterSocketSend.bind(ADDRESS)
    console.log('bind', ADDRESS)

    os.cpus().map((_, id) => {
      const ID = id + 1
      c.fork({WORKER_ID: ID})
    })

    let i = 0
    while (i++ < 100) {
      const result = await masterSocketSend.receive()
      console.log('server', result[1].toString())
      await masterSocketSend.send([result[0], result[1].toString()])
    }
  }

  if (c.isWorker) {
    // C L I E N T
    const ID = process.env.WORKER_ID as string

    const workerSocketRecv = new zmq.Dealer()
    const addr = ADDRESS
    workerSocketRecv.connect(addr)
    console.log('connect', addr)

    while (true) {
      await workerSocketRecv.send('GIVE_FILES_' + ID.toString())

      const result = await workerSocketRecv.receive()
      console.log('recv', result.toString())
    }
  }
}

main().catch(err => {
  console.log(err)
  process.exit(1)
})
