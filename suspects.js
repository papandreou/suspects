#!/usr/bin/env node

const childProcess = require('child_process');
const semver = require('semver');
const inquirer = require('inquirer');
const promisify = require('util').promisify;
const pMap = require('p-map');

let { good, bad } = require('yargs')
  .option('good', {
    type: 'string',
    describe: 'Date or datetime where the project was last known to work'
  })
  .option('bad', {
    type: 'string',
    describe: 'Date or datetime where the project was first found broken'
  }).argv;

async function exec(cmd) {
  return await promisify(cb =>
    childProcess.exec(cmd, { maxBuffer: 999999999 }, cb.bind(null))
  )();
}

async function getTimeOfHeadCommit() {
  try {
    return new Date(await exec('git show -s --format=%ci'));
  } catch (err) {}
}

(async () => {
  let goodTime = new Date(
    good ||
      (await inquirer.prompt({
        type: 'input',
        message: 'When did it last work?',
        default: await getTimeOfHeadCommit(),
        name: 'good',
        validate: str => !isNaN(new Date(str).getTime())
      })).good
  );

  let badTime = new Date(
    bad ||
      (await inquirer.prompt({
        type: 'input',
        message: 'When did it stop working?',
        name: 'bad',
        default: new Date().toLocaleString(),
        validate: str => !isNaN(new Date(str).getTime())
      })).bad
  );

  const npmLs = JSON.parse(await exec('npm ls --json'));

  const packageNames = new Set();
  const froms = {};
  (function traverse(obj, name) {
    if (name) {
      packageNames.add(name);
      (froms[name] = froms[name] || []).push(
        (obj.from || '*').replace(`${name}@`, '')
      );
    }
    if (obj.dependencies) {
      for (const [name, value] of Object.entries(obj.dependencies)) {
        traverse(value, name);
      }
    }
  })(npmLs);

  const culprits = [];
  await pMap(
    [...packageNames],
    async packageName => {
      const npmInfo = JSON.parse(await exec(`npm info --json ${packageName}`));
      for (const [version, timeStr] of Object.entries(npmInfo.time)) {
        if (['modified', 'created'].includes(version)) {
          continue;
        }
        const time = new Date(timeStr);
        let isWithinRange = true;
        try {
          isWithinRange = froms[packageName].some(from =>
            semver.satisfies(version, from)
          );
        } catch (err) {
          console.warn(`${packageName}: ${err.message}`);
        }
        if (time > goodTime && time <= badTime && isWithinRange) {
          culprits.push({ packageName, version, time });
        }
      }
    },
    { concurrency: 10 }
  );

  culprits.sort((a, b) => a.time - b.time);

  for (const { packageName, version, time } of culprits) {
    console.log(`${time.toJSON()}: ${packageName}@${version}`);
  }
})();
