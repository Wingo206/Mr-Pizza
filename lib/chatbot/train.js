const {dockStart} = require('@nlpjs/basic');
const path = require('path');

async function train() {
   const dock = await dockStart({use: ['Basic']});
   const nlp = dock.get('nlp');
   nlp.addLanguage('en');

   await nlp.addCorpus(__dirname + path.sep + 'corpus2.json');
   await nlp.train({log: true});
   await nlp.save(__dirname + path.sep + 'MrPizza.nlp');
   console.log('Model training complete.');
}

if (require.main === module) {
   train();
}

module.exports = {
   train
}
