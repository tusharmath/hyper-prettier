/* tslint:disable: no-console no-unbound-method comment-format prefer-template prefer-function-over-method*/

import * as zmq from 'zeromq'

import {Coordinator} from './Coordinator'
import {runZMQ} from './RunZMQ'

const ADDRESS = 'ipc:///tmp/pub-sub.ipc'

class QMaster extends Coordinator {
  private readonly publisher = new zmq.Publisher()
  public async init(): Promise<void> {
    await this.publisher.bind(ADDRESS)
    await this.coordinate()

    await this.publish(1)

    this.dispose()
  }

  private dispose() {
    this.publisher.close()
    this.workers?.forEach(_ => {
      _.kill('SIGTERM')
    })
  }

  private async publish(n: number) {
    if (n === 0) {
      return
    }
    await this.publisher.send([
      n % 2 === 0 ? 'EVEN' : 'ODD',
      'HELLO_' + n.toString()
    ])
    await this.publish(n - 1)
  }
}

class QWorker extends Coordinator {
  private readonly subscriber = new zmq.Subscriber({})

  public async init(): Promise<void> {
    await this.coordinate()
    // S E R V E R
    const ID = process.env.WORKER_ID

    // DO BOTH
    this.subscriber.connect(ADDRESS)
    this.subscriber.subscribe(Number(ID) % 2 === 0 ? 'EVEN' : 'ODD')

    while (true) {
      const buffer = await this.subscriber.receive()
      const msg = buffer.toString()

      console.log('worker', ID, msg)
    }
  }
}

// BOOTSTRAP
runZMQ(
  () => new QMaster().init(),
  () => new QWorker().init()
).catch(err => {
  console.error(err)
  process.exit(1)
})
