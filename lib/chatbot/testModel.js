const {dockStart} = require('@nlpjs/basic');
const readline = require('readline');
const path = require('path');

async function testModel() {
   const dock = await dockStart({use: ['Basic']});
   const nlp = dock.get('nlp');
   await nlp.load(__dirname + path.sep + 'MrPizza.nlp');

   // read lines from the input
   const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
   });

   rl.on('line', async (line) => {
      const response = await nlp.process('en', line);
      console.log(response);
   });

   rl.once('close', () => {
      // end of input
   });
}

testModel();
