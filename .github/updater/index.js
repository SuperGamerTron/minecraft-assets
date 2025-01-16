const fs = require('fs')
const cp = require('child_process')

async function fetchLatest() {
  const readmePath = './README.md'
  const endpoint = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'

  const readme = fs.readFileSync(readmePath, 'utf-8');
  const versions = readme.match(/[\d., ]+ and \d+\.\d+\.\d*/)[0]
    .replace(' and', ',')
    .split(', ')
    .map(v => v.trim())

  cp.execSync(`curl -L ${endpoint} -o versions.json`, { stdio: 'inherit', shell: true })
  const latestVersion = JSON.parse(fs.readFileSync('versions.json')).latest.release

  if (!versions.includes(latestVersion)) {
    console.log('Updating assets...')
    cp.execSync(`git clone https://github.com/PrismarineJS/minecraft-jar-extractor`)

    console.log('Extracting data...')
    cp.execSync(`cd ./minecraft-jar-extractor && npm i && node image_names.js ${latestVersion} ../data temp`)

    console.log('Updating README...')
    const updatedReadme = readme.replace(
      /[\d., ]+ and \d+\.\d+\.\d*/,
      versions.concat(latestVersion).sort().join(', ').replace(/, (\d+\.\d+\.\d*)$/, ' and $1')
    )
    fs.writeFileSync(readmePath, updatedReadme)

    console.log(`::set-output name=latestVersion::${latestVersion}`)
    process.exit(0)
  } else {
    console.log('Assets are up to date.')
    process.exit(1)
  }
}

fetchLatest()
