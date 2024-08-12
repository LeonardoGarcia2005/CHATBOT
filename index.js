import {expressMiddleware} from '@apollo/server/express4';
import cors from 'cors';
import pkg1 from 'body-parser';
const { urlencoded, json } = pkg1;
import {configurationProvider} from './globalServices/config/configurationManager.js';
import { dbConnectionProvider } from './models/db/dbConnectionManager.js';
import { loggerGlobal } from './globalServices/logging/loggerManager.js';
import { app, httpServer, apolloServer } from './app.js';
import { adicionarMessenger } from './channels/facebook/manejadorMessenger.js';
import { EmpresaDataLoader } from './models/dataAccessObjects/empresaLoader.js';
import {createHmac} from 'node:crypto';
import { jwtProvider } from './globalServices/security/jwtManager.js';
import { exit } from 'node:process';
import {v4} from 'uuid'; // Librería para generar UUIDs únicos
import pkg from 'express-session'
import { manejadorWhatsapp } from './channels/whatsapp/src/app.mjs';
const session = pkg;
//const {uuid} = pkg2;

const PUERTO_WEB = configurationProvider.services.port;
loggerGlobal.debug(`Tengo el puerto web: `+PUERTO_WEB);

try{
    loggerGlobal.info(`Iniciando el apollo server ...`);
    await apolloServer.start();
}
catch(error){
    loggerGlobal.error('Error al iniciar el servidor graphql; No se podrá iniciar el sistema ...',error);
    exit(-1);
}

//configuracion de cors para que no ocurra el conflicto de los dos puertos distintos
const corsOptions = {
    origin: [
      "http://localhost:5173",

    ],
    credentials: true,
    allowedHeaders: ['sessionID','content-type','authorization'],  // Agrega esta línea para permitir el encabezado Authorization
  };
  

app.use(session({
    secret: configurationProvider.clientSession.secret,
    resave: false,
    saveUninitialized: false,
  })
);


//Middleware para hacer que si vienen 2 requests de un mismo navegador pero diferentes ventanas, 
//se genere un id de ventana distinto
/*app.use((req, res, next) => {
    if (!req.session.windowId) {
      /*req.session.regenerate(function(err){
        if (err){ 
            loggerGlobal.error('Error al regenerar la sesión en el servidor .. '+err.message);
            next(err);
        }
      });
      req.session.windowId = v4(); // Generar un UUID único para cada ventana
      loggerGlobal.debug('el uuid generado es: '+req.session.windowId);
      res.cookie('windowId', req.session.windowId, { maxAge: 900000, httpOnly: true }); // Establecer la cookie con el UUID
    }
    next();
  });*/

// graphql endpoint
app.use(
    '/graphql',
    //cors(),
    cors(corsOptions),
    json(),
    expressMiddleware(apolloServer, {
        context: async ({ req, res }) => { 
            const jwtContext = await jwtProvider({ req, res });

            return {
              session: req.session,
              datasources: {
                  empresasDataLoader: new EmpresaDataLoader(dbConnectionProvider),
              },
              ...jwtContext, //Contexto para evaluar la autenticación en los header para consumir los servicios
            }
        },
    }),
);

if (configurationProvider.messengerAPI.activate && configurationProvider.messengerAPI.activate === true)
{
  try
  {
      loggerGlobal.info(`Adicionando el manejador del Facebook Messenger ...`);
      await adicionarMessenger(app);

  }catch(error){
      const mensaje = `Error al adicionar el manejador de Facebook Messenger;
                       No estará disponible este módulo del sistema ...`;
      loggerGlobal.error(mensaje,error);
  }
}

loggerGlobal.info(`Adicionando el manejador del Whatsapp Bussines ...`);
      await manejadorWhatsapp(app);

await new Promise((resolve) => httpServer.listen({ port: PUERTO_WEB }, resolve));
loggerGlobal.info(`🚀 Server ready at http://localhost:`+PUERTO_WEB);

