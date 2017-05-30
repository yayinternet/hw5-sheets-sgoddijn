const express = require('express');
const bodyParser = require('body-parser');
const googleSheets = require('gsa-sheets');

const key = require('./privateSettings.json');

const SPREADSHEET_ID = '17NRCedZvNmrvRpIXCCgP9xw37iouHVt_sT_gB1Jkblk';

const app = express();
const jsonParser = bodyParser.json();
const sheet = googleSheets(key.client_email, key.private_key, SPREADSHEET_ID);

app.use(express.static('public'));

function createArray(result, rows) {
  const titles = [];
  let num_fields = result.rows[0].length;
  for (let i=0; i<num_fields; i++) {
    titles.push(result.rows[0][i]);
  }
  const objects = [];
  var object = {};
  for (let i=1; i<result.rows.length; i++) {
      for (let j=0; j<titles.length; j++) {
          var name = titles[j];
          var value = result.rows[i][j];
          object[name] = value;
      }
      objects.push(object);
      object = {};
  }
  return objects;
}

async function onGet(req, res) {
  const result = await sheet.getRows();
  const rows = result.rows;
  console.log(rows);
  const objects = createArray(result, rows, res);
  res.json(objects);
}
app.get('/api', onGet);

async function onPost(req, res) {
  const messageBody = req.body;
  const result = await sheet.getRows();
  const rows = result.rows;
  let num_fields = result.rows[0].length;
  const objects = [];
  for (let i=0; i<num_fields; i++) {
    objects.push(messageBody[result.rows[0][i]]);
  }
  sheet.appendRow(objects);
  res.json( { status: 'sucess'} );
}
app.post('/api', jsonParser, onPost);



async function onPatch(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const messageBody = req.body;
  const result = await sheet.getRows();
  const rows = result.rows;
  const objects = createArray(result, rows, res);


  let index = 0;
  for (let i = 0; i<objects.length; i++) {
    if (objects[i][column] === value) {
      index = i;
    }
  }

  const titles = [];
  let num_fields = result.rows[0].length;
  for (let i=0; i<num_fields; i++) {
    titles.push(result.rows[0][i]);
  }
  var object = [];
  for (let i=0; i<titles.length; i++) {
      let title = titles[i];
      if (messageBody[title] !== undefined) {
        object.push(messageBody[title]);
      } else {
        object.push(objects[index][title]);
      }
  }
  sheet.setRow(index+1, object);
  res.json( { status: 'sucess'} );

}
app.patch('/api/:column/:value', jsonParser, onPatch);


async function onDelete(req, res) {
  const column  = req.params.column;
  const value  = req.params.value;
  const result = await sheet.getRows();
  const rows = result.rows;
  const objects = createArray(result, rows, res);

  for (let i = 0; i<objects.length; i++) {
    if (objects[i][column] === value) {
      sheet.deleteRow(i+1);
    }
  }
  res.json( { status: 'success'} );
}
app.delete('/api/:column/:value',  onDelete);


// Please don't change this; this is needed to deploy on Heroku.
const port = process.env.PORT || 3000;

app.listen(port, function () {
  console.log(`Server listening on port ${port} bruh!`);
});
