/* tslint:disable */

import * as cl from 'cluster'
import * as os from 'os'
import * as mq from 'zeromq'

const IPC_SOCKET = 'ipc:///tmp/sock.ipc'
const main = async () => {
  if (cl.isMaster) {
    os.cpus().map(() => cl.fork())

    const source = new mq.Push()

    await source.bind(IPC_SOCKET)
    await source.send('XXX')
    await source.send('XXX2')
    // setInterval(() => {
    //   source.send('A')
    // }, 50)
  } else {
    // console.log('WORKER')
    const client = new mq.Pull()
    client.connect(IPC_SOCKET)

    while (true) {
      const R = await client.receive()
      console.log('REC', R.toString())
    }
  }
}

main().catch(console.log)

// console.log('HI')

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})
