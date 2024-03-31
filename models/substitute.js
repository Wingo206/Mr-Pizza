const path = require('path');
const fs = require('node:fs');
const conf = require('../lib/util/config');

async function substitute(config, outFilename) {

   let templatePath = __dirname + path.sep + 'template_setup.sql';
   let template = await fs.readFileSync(templatePath, 'utf8')
   // console.log(template)
   for (const [key, value] of Object.entries(config)) {
      template = template.replaceAll('{{' + key + '}}', value);
   }
   let tempPath = __dirname + path.sep + 'temp'
   if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath)
   }
   let outPath = tempPath + path.sep + outFilename + '.sql';
   fs.writeFileSync(outPath, template);
}

substitute(conf, 'setup');
// hack to create a script with the unit test database
conf2 = JSON.parse(JSON.stringify(conf));
conf2.database = conf2.unitTestDatabase;
substitute(conf2, 'unittestSetup');
