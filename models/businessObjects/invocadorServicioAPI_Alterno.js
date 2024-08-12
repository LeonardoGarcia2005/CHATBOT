import http from 'http';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';

const url = process.argv[2];

http.get(url, function(response) {
  let finalData = "";

  response.on("data", function (data) {
    finalData += data.toString();
    loggerGlobal.debug('Adicione data en el response ...');
  });

  response.on("end", function() {
    console.log(finalData.length);
    console.log(finalData.toString());
    loggerGlobal.debug('Se invoco el end() en el response ...');
  });

});