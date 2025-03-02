const fs = require('fs')
const cp = require('child_process')

function compareVersions(a, b) {
  const [aMajor, aMinor = 0, aPatch = 0] = a.split('.').map(Number)
  const [bMajor, bMinor = 0, bPatch = 0] = b.split('.').map(Number)

  return aMajor - bMajor || aMinor - bMinor || aPatch - bPatch
}

async function fetchLatest() {
  const readmePath = './README.md'
  const endpoint = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'
  const versions = fs.readdirSync('./data').filter(x => x !== 'common')

  cp.execSync(`curl -L ${endpoint} -o versions.json`, { stdio: 'inherit', shell: true })
  const latestVersion = JSON.parse(fs.readFileSync('versions.json')).latest.release

  const status = cp.execSync(`curl -LI https://github.com/PrismarineJS/minecraft-assets/tree/${latestVersion} -o /dev/null -w '%{http_code}\n' -s`)
    .toString()
    .trim()

  if (status === '404') {
    console.log('Updating assets...')
    cp.execSync(`git clone https://github.com/PrismarineJS/minecraft-jar-extractor`)

    console.log('Extracting data...')
    cp.execSync(`cd ./minecraft-jar-extractor && npm i && node image_names.js ${latestVersion} ../data temp`)
    
    console.log('Updating README...')
    const sortedVersions = versions.sort(compareVersions)
    const readme = fs.readFileSync(readmePath, 'utf-8')
    fs.writeFileSync(readmePath, readme.replace(/\d.*\d/, `${sortedVersions.join(', ')} and ${latestVersion}`))

    console.log(`::set-output name=latestVersion::${latestVersion}`)
    process.exit(0)
  } else {
    console.log('Assets are up to date.')
    process.exit(1)
  }
}

fetchLatest()
