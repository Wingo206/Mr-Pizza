const path = require('path');
const fs = require('node:fs');
const config = require('../lib/util/config');

async function substitute() {

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
   let outPath = tempPath + path.sep + 'setup.sql';
   fs.writeFileSync(outPath, template);
}

substitute();
