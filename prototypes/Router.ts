/* tslint:disable */

import * as c from 'cluster'
import * as zmq from 'zeromq'
import * as os from 'os'

const OUT_TRANSPORT = 'ipc:///tmp/sock-router.ipc'

const delay = (n: number) => new Promise(res => setTimeout(res, n))

const main = async () => {
  if (c.isMaster) {
    const masterSocketSend = new zmq.Request({sendHighWaterMark: 0})

    await Promise.all(
      os.cpus().map(async (_, i) => {
        c.fork({WORKER_ID: i + 1})
        const addr = OUT_TRANSPORT + '_' + (i + 1)

        await masterSocketSend.connect(addr)
      })
    )

    const itar = async (msg: string, n: number): Promise<void> => {
      if (n === 0) return

      await masterSocketSend.send('HI_' + n)

      masterSocketSend.receive().then(R => {
        console.log('-', msg, R.toString())
      })

      return await itar(msg, n - 1)
    }
    await itar('HI', 100)
  }

  if (c.isWorker) {
    const ID = process.env.WORKER_ID

    const workerSocketRecv = new zmq.Reply()
    const addr = OUT_TRANSPORT + '_' + ID
    await workerSocketRecv.bind(addr)

    const buffer = await workerSocketRecv.receive()

    const msg = buffer.toString()
    console.log('+', ID, msg)

    await delay(1_000)
    await workerSocketRecv.send(msg.split('_')[1])
  }
}

main().catch(console.log)
