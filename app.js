const express = require('express');
//un tipo de BBDD
const Datastore = require('nedb');

//necesario para hacer el fetch desde el servidor a la api externa
// instalar con npm install node-fetch
const fetch = require('node-fetch');

//esto es para la base de datos
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Starting server at ${port}`);
});
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

const database = new Datastore('database.db');
database.loadDatabase();

app.get('/api', (request, response) => {
  database.find({}, (err, data) => {
    if (err) {
      response.end();
      return;
    }
    response.json(data);
  });
});

//para insertar en la base de datos
app.post('/api', (request, response) => {
  const data = request.body;
  const timestamp = Date.now();
  data.timestamp = timestamp;
  database.insert(data);
  response.json(data);
});

//aqui se hace la llamada con el fetch
app.get('/weather/:latlon', async (request, response) => {
  console.log(request.params);

  //parsear la info que mandas en 1 variable, el geolocation normalmente te devuelve tu lat y long juntas en variable lat long
  //por lo que es necesario separarlo porque la api del ejemplo las necesita separadas
  const latlon = request.params.latlon.split(',');
  console.log(latlon);

  const lat = latlon[0];
  const lon = latlon[1];
  console.log(lat, lon);

  //la api key necesaria para la api del tutorial / ya no esta disponible la pagina web ni la api, no todas las APIs requieren de key
  const api_key = process.env.API_KEY;
  //la url a la api donde queremos hacer la peticion
  //se tiene que hacer desde el servidor y no desde el cliente, ya que CORS saltara sino y bloqueara cualquier peticion
  const weather_url = `https://api.darksky.net/forecast/${api_key}/${lat},${lon}/?units=si`;

  //se hace al fin el fetch de node-fetch con la url a la api
  const weather_response = await fetch(weather_url);

  //convertimos el json que devuelve la respuesta en un Javascript Object
  const weather_data = await weather_response.json();

  //request fetch a otra api, mismos pasos q lo anterior
  const aq_url = `https://api.openaq.org/v1/latest?coordinates=${lat},${lon}`;
  const aq_response = await fetch(aq_url);
  const aq_data = await aq_response.json();

  const data = {
    weather: weather_data,
    air_quality: aq_data
  };
  response.json(data);
});
