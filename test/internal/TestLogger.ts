export const testLogger = (regex: RegExp = /.*/) => {
  const log = new Array<string>()

  return {
    get stdout() {
      return log.filter(_ => _.match(regex))
    },
    log: (scope: string) => (...t: unknown[]) => {
      log.push([scope, ...t].join(' '))
    }
  }
}
