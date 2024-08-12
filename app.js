import { ApolloServer } from '@apollo/server';
//import {expressMiddleware} from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import pkg1 from 'body-parser';
const { json } = pkg1;
import express from 'express';
import http from 'http';
import {schema} from './graphql/schema.js';
import {graphqlErrorManager} from './graphql/errors/graphQLErrorManager.js';
import {dbConnectionProvider} from './models/db/dbConnectionManager.js';
import { loggerGlobal } from './globalServices/logging/loggerManager.js';
import { myGraphqlMiddlewarePluggin } from './graphql/middleWares/graphqlMiddlewarePlugin.js';
import { exit } from 'process';

console.log('tengo un loggerGlobal: '+loggerGlobal);
if (!loggerGlobal){
  console.error('No se pudo crear el logger global: No podra iniciarse el sistema.');
  exit(-1);
}

const conectoServerBD = await dbConnectionProvider.verificarConexionBD();
if (conectoServerBD == null){
  loggerGlobal.error('No se logró establecer conexion a la BD; NO se podrá iniciar el servidor');
  exit(-1);
}
else loggerGlobal.info('Se logro conectar a la BD ...');

loggerGlobal.debug(`Tengo el objeto para acceder a la BD: `+dbConnectionProvider);
loggerGlobal.debug(`Tengo el formateador de errores: `+graphqlErrorManager);

const app = express();//.use('*', cors());
const httpServer = http.createServer(app);
loggerGlobal.info(`Creado el servidor web para http con express ...`);

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const typeDefs = schema.typeDefs;
const resolvers = schema.resolvers;
const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    formatError:graphqlErrorManager.errorsFormatter,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      myGraphqlMiddlewarePluggin,
    ],
    /*cors: {
      origin:"*",
      credentials: true
    },*/
  });

export {app};
export {httpServer};
export {apolloServer};