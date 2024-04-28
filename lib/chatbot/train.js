const {dockStart} = require('@nlpjs/basic');
const path = require('path');
const {generateMenuCorpus} = require('./generateMenuCorpus');

async function train() {
   const dock = await dockStart({use: ['Basic']});
   const nlp = dock.get('nlp');
   nlp.addLanguage('en');

   // QnA
   await nlp.addCorpus(path.join(__dirname, 'corpus2.json'));

   // menu information
   await generateMenuCorpus();
   await nlp.addCorpus(path.join(__dirname, 'menuCorpus.json'));
   

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
