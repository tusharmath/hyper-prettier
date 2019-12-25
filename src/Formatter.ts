import {QIO} from '@qio/core'
import {FS} from '@qio/fs'
import * as prettier from 'prettier'

import {logger} from './Logger'

const log = logger('Formatter')

/**
 * Reads the file at the provided path and tries to format it
 */
export const format = (path: string) =>
  log('path', path).and(
    FS.open(path, 'w+')
      .chain(fd => log('fs.open', `${fd} ${path}`).const(fd))
      .bracket(fd => FS.close(fd).and(log('fs.close', `${fd} ${path}`)))(fd =>
        FS.readFile(fd)
          .do(log('fs.readFile', `${fd} ${path}`))
          .chain(buffer => {
            const content = buffer.toString()
            const fContent = prettier.format(content, {filepath: path})

            return QIO.if(
              content === fContent,
              QIO.void().and(log('format', `${path} SKIP`)),
              FS.writeFile(fd, fContent).and(log('format', `${path} OK`))
            )
          })
      )
      .catch(err => log('error', path).and(log('error', err.message)))
  )
