## suspects

Help locate a regression in a project caused by a new version of a direct or
indirect dependency.

It will do a complete inventory of packages in `node_modules` and will then
query the npm registry to find out if new in-range versions were released
between the point in time where your project was last known to work and when it
broke.

### Quick start

From the project that experienced the regression, run:

```
npm i # (or npm ci if you use a lock file)
npx suspects
```

This will prompt you for a time range, and will suggest good/bad times based on
the latest commit.

Eventually you will see a list of suspects:

```
2019-05-17T04:02:32.998Z: electron-to-chromium@1.3.135
2019-05-17T04:25:59.439Z: connect@3.6.7
2019-05-17T10:55:32.025Z: uglify-js@3.5.13
2019-05-17T12:43:34.606Z: rollup@1.12.2
2019-05-17T13:09:37.872Z: rollup-pluginutils@2.7.1
2019-05-18T00:58:45.162Z: connect@3.7.0
2019-05-18T16:08:12.518Z: fugl@1.3.0
2019-05-19T09:40:38.836Z: rollup@1.12.3
```

### Installation

```
npm install -g suspects
```

### Usage

```
Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --good     Date or datetime where the project was last known to work  [string]
  --bad      Date or datetime where the project was first found broken  [string]
```
