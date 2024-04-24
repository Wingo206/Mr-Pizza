const {dockStart} = require('@nlpjs/basic');
const path = require('path');
const {getJSONBody} = require("../util/inputValidationUtil");
const fs = require('node:fs');
const {train} = require('./train');

let nlp;

async function loadModel() {
   // train first if the model isn't there yet
   modelPath = __dirname + path.sep + 'MrPizza.nlp';
   if (!fs.existsSync(modelPath)) {
      await train();
   }

   const dock = await dockStart({use: ['Basic']});
   nlp = dock.get('nlp');
   await nlp.load(modelPath);
}

loadModel();

/**
 * input body: {question: 'my question'}
 * response: {
 *    success: boolean,
 *    answer: string
 * }
 */
async function handleChatbotQuestion(req, res) {
   let decodedData = await getJSONBody(req, res, ['question']);
   console.log(decodedData)
   if (!decodedData) {
      return;
   }
   let question = decodedData['question'];
   const response = await nlp.process('en', question);
   console.log(response);

   if (response.intent == 'None') {
      res.writeHead(200, {'Content-type': 'application/json'});
      res.end(JSON.stringify({
         success: false,
         answer: `Sorry, I can\'t help you with that. 
         For further assistance, please submit a help ticket.`
      }));
      return;
   }

   res.writeHead(200, {'Content-type': 'application/json'});
   res.end(JSON.stringify({
      success: true,
      answer: response.answer
   }));
}

module.exports = {
   routes: [
      {
         method: 'POST',
         path: '/chatbot',
         handler: handleChatbotQuestion
      },
   ]
}
