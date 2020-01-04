import * as c from 'cluster'
import * as os from 'os'

export const fork = () => {
  const workers: c.Worker[] = []
  os.cpus().map((_, i) => {
    const ID = i + 1
    workers.push(c.fork({WORKER_ID: ID}))
  })

  return workers
}
