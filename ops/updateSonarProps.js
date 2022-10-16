const fs = require('fs');

console.log('Updating the SonarQube properties...');

// Get new package version
const packageVersion = require('../package.json').version;
console.log(`Version: ${packageVersion}`);

// Read old Sonar config
const sonarFile = 'sonar-project.properties';
console.log(`Sonar file: ${sonarFile}`);
const sonarConfig = fs.readFileSync(sonarFile, 'utf-8');

// Write new Sonar config 
const newSonarCofig = sonarConfig.replace(/sonar.projectVersion=.*/, `sonar.projectVersion=${packageVersion}`);
fs.writeFileSync(sonarFile, newSonarCofig);
