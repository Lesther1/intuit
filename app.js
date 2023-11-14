require('dotenv').config
const express = require('express');
const session = require('express-session');
const intuitOauth = require('intuit-oauth');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
const puerto = 3000;

// Configurar la sesión
app.use(session({ secret: 'tu_secreto', resave: true, saveUninitialized: true }));


// Configurar las credenciales de OAuth
const oauthClient = new intuitOauth({
  clientId: 'ABRSHpzDeftShiJEnNKQih8EkhpD4csMNyviIrl6Y8Q1pyEaJl',
  clientSecret: '0vvrjkmubbfXGLrpuMD5MInNEDMRJEngNSIxknaj',
  environment: 'sandbox', // Puedes cambiarlo a 'production' en un entorno de producción
  redirectUri: 'https://intuittest.onrender.com/callback',
});

// Ruta de inicio de sesión con Intuit
app.get('/auth/intuit', (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [intuitOauth.scopes.Accounting],
    state: 'estado_de_tu_aplicacion',
  });
  res.redirect(authUri);
});

// Ruta de retorno de Intuit después de la autorización
app.get('/callback', async (req, res) => {
  try {
    console.log('Iniciando autenticación...');
    const authResponse = await oauthClient.createToken(req.url);

    // Almacena el objeto authResponse en la sesión para su posterior uso
    req.session.authResponse = authResponse;

    // Redirige a la ruta CompanyInfo para mostrar la información de la empresa
    res.redirect('/bills');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al autenticar con Intuit');
  }
});

// Ruta de información de la empresa
app.get('/bills', async (req, res) => {
  try {
    const authResponse = req.session.authResponse;

    if (!authResponse) {
      // Si no hay respuesta de autenticación, redirigir a iniciar sesión
      res.redirect('/auth/intuit');
      return;
    }

    const companyID = authResponse.token.realmId;
    const url = "https://sandbox-quickbooks.api.intuit.com";

    try {
      const apiResponse = await oauthClient.makeApiCall({ url: `${url}/v3/company/${companyID}/query?query=select * from bill`});
      //const companyInfo = JSON.parse(apiResponse.body).CompanyInfo;
      const bills = JSON.parse(apiResponse.body);      // Extraer el nombre de la empresa
      //const companyName = companyInfo.CompanyName;
      res.send(bills)
    } catch (error) {
      console.error(error);

      if (error.statusCode) {
        // Manejar errores específicos basados en el código de estado
        res.status(error.statusCode).send(`Error en la llamada de la API: ${error.message}`);

      } else {
        res.status(500).send('Error al hacer la llamada de la API');
      }
    }
  } catch (error) {
    console.error(error);
    res.status(401).send('Error de autenticación');
  }
});

app.get('/Invoice', async (req, res) => {
  try {
    const authResponse = req.session.authResponse;

    if (!authResponse) {
      // Si no hay respuesta de autenticación, redirigir a iniciar sesión
      res.redirect('/auth/intuit');
      return;
    }

    const companyID = authResponse.token.realmId;
    const url = "https://sandbox-quickbooks.api.intuit.com";

    try {
      const apiResponse = await oauthClient.makeApiCall({ url: `${url}/v3/company/${companyID}/query?query=select * from Invoice`});
      //const companyInfo = JSON.parse(apiResponse.body).CompanyInfo;
      const bills = JSON.parse(apiResponse.body);      // Extraer el nombre de la empresa
      //const companyName = companyInfo.CompanyName;
      res.send(bills)
    } catch (error) {
      console.error(error);

      if (error.statusCode) {
        // Manejar errores específicos basados en el código de estado
        res.status(error.statusCode).send(`Error en la llamada de la API: ${error.message}`);

      } else {
        res.status(500).send('Error al hacer la llamada de la API');
      }
    }
  } catch (error) {
    console.error(error);
    res.status(401).send('Error de autenticación');
  }
});

// Ruta protegida que requiere autenticación
app.get('/protegido', autenticacionMiddleware, (req, res) => {
  res.json({ mensaje: 'Ruta protegida, usuario autenticado' });
});

// Middleware de autenticación personalizado
function autenticacionMiddleware(req, res, next) {
  // Si el usuario está autenticado, permitir el acceso
  if (req.session.authResponse) {
    return next();
  }

  // Si no está autenticado, redirigir a la página de inicio de sesión
  res.redirect('/');
}

// Ruta de inicio
app.get('/', (req, res) => {
  res.send('¡Bienvenido! <a href="/auth/intuit">Iniciar sesión con Intuit</a>');
});

// Iniciar el servidor
app.listen(puerto, () => {
  console.log(`Servidor iniciado en el ${puerto}`);
});
