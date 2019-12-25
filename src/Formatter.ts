import {FS} from '@qio/fs'
import * as prettier from 'prettier'

import {logger} from './Logger'

const log = logger('Formatter')

/**
 * Reads the file at the provided path and tries to format it
 */
export const format = (path: string) =>
  log('path', path).and(
    FS.open(path, 'w')
      .chain(fd => log('fs.open', `${fd} ${path}`).const(fd))
      .bracket(fd => FS.close(fd).and(log('fs.close', `${fd} ${path}`)))(fd =>
        FS.readFile(fd)
          .do(log('fs.readFile', `${fd} ${path}`))
          .map(buffer => prettier.format(buffer.toString(), {filepath: path}))
          .chain(content => FS.writeFile(fd, Buffer.from(content)))
      )
      .and(log('format', `${path} OK`))
      .catch(err => log('error', path).and(log('error', err.message)))
  )
