const fs = require('fs')
const cp = require('child_process')

async function fetchLatest() {
  const readmePath = './README.md'
  const endpoint = 'https://launchermeta.mojang.com/mc/game/version_manifest.json'

  const readme = fs.readFileSync(readmePath, 'utf-8');
  const versions = fs.readdirSync('./data')

  cp.execSync(`curl -L ${endpoint} -o versions.json`, { stdio: 'inherit', shell: true })
  const latestVersion = JSON.parse(fs.readFileSync('versions.json')).latest.release

  console.log(cp.execSync(`curl -LI https://github.com/SuperGamerTron/minecraft-assets/tree/${latestVersion} -w '%{http_code}\n' -s`).toString())

  const status = cp.execSync(`curl -LI https://github.com/SuperGamerTron/minecraft-assets/tree/${latestVersion} -o /dev/null -w '%{http_code}\n' -s`).toString()

  console.log(`.${status}.`)

  if (status == 404) {
    console.log('Updating assets...')
    cp.execSync(`git clone https://github.com/PrismarineJS/minecraft-jar-extractor`)

    console.log('Extracting data...')
    cp.execSync(`cd ./minecraft-jar-extractor && npm i && node image_names.js ${latestVersion} ./data temp`)

    console.log('Updating README...')
    fs.writeFileSync(readmePath, readme.replace(/\d.*\d/, `${versions.join(', ')}and${latestVersion}`))

    console.log(`::set-output name=latestVersion::${latestVersion}`)
    process.exit(0)
  } else {
    console.log('Assets are up to date.')
    process.exit(1)
  }
}

fetchLatest()
