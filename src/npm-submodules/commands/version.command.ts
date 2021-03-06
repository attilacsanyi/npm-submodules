// import { TsmOptions } from '../types';
const execa = require('execa');
import Listr = require('listr');
import { findSubmodules } from '../utils/submodules-resolution';
import { npmVersion } from '../tasks/npm/npm-version.task';

export function run(cli) {
  const {project, verbose, message, gitTagVersion, yarn} = cli.flags;
  const noGitTagVersion = gitTagVersion === false;
  const version = cli.input[1];

  if (!version) {
    return Promise.reject('Error: please provide version like (patch, major, prerelase, 1.2.3, etc.');
  }

  return findSubmodules(project)
    .then((opts: TsmOptions[]) => {
      // 1. version all sub modules
      // 2. version root package
      const tasks = new Listr([
        {
          title: 'Version all submodules',
          task: () => new Listr(
            opts.map(opt => ({
              title: `npm version  (${opt.pkg.name}: ${opt.src})`,
              task: () => npmVersion({yarn, src: opt.src, version, noGitTagVersion: true})
            }))
          )
        },
        {
          title: 'git add -A',
          task: () => execa.shell('git add -A'),
          skip: () => noGitTagVersion
        },
        {
          title: 'Version root package',
          task: () => npmVersion({yarn, src: '.', version, message, noGitTagVersion})
        }
      ], {renderer: verbose ? 'verbose' : 'default'});

      return tasks.run();
    });
}
