import * as c from 'cluster'

export const runZMQ = async (
  main: () => Promise<void>,
  worker: () => Promise<void>
): Promise<void> => {
  if (c.isMaster) {
    return main()
  }

  return worker()
}
