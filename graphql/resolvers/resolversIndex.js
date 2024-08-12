import { canalQueries } from './canal/queries.js';
import { clienteQueries } from './clienteCanal/queries.js';
import { clienteCanalMutations } from './clienteCanal/mutations.js';
import { clienteCanalFields } from './clienteCanal/fields.js'
import { conversacionQueries } from './conversacion/queries.js';
import { conversacionMutations } from './conversacion/mutations.js';
import { conversacionFields } from './conversacion/fields.js';
import { condicionEntradaQueries } from './condicionEntrada/queries.js';
import { empresaQueries } from './empresa/queries.js';
import { faseConversacionQueries } from './faseConversacion/queries.js';
import { faseInteraccionQueries } from './faseInteraccion/queries.js';
import { faseInteraccionMutations } from './faseInteraccion/mutations.js';
import { faseInteraccionFields } from './faseInteraccion/fields.js';
import { guionConversacionQueries } from './guionConversacion/queries.js';
import { guionConversacionMutations } from './guionConversacion/mutations.js';
import { guionConversacionFields } from './guionConversacion/fields.js';
import { invocadorQueries } from './invocadorServiciosAPI/queries.js';
import { usuarioQueries } from './usuario/queries.js';
import { usuarioMutations } from './usuario/mutations.js';
import {dateScalar} from './../scalarTypeDate.js';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import GraphQLJSON from 'graphql-type-json';

const resolvers = {
  miTimestamp: dateScalar,
  JSON: GraphQLJSON,
  Query: {
    ...canalQueries,
    ...clienteQueries,
    ...condicionEntradaQueries,
    ...conversacionQueries,
    ...empresaQueries,
    ...faseConversacionQueries,
    ...faseInteraccionQueries,
    ...guionConversacionQueries,
    ...invocadorQueries,
    ...usuarioQueries,
  },
  Mutation: {
    ...clienteCanalMutations,
    ...conversacionMutations,
    ...faseInteraccionMutations,
    ...guionConversacionMutations,
    ...usuarioMutations,
  },
  ...clienteCanalFields,
  ...conversacionFields,
  ...faseInteraccionFields,
  ...guionConversacionFields,
};
  
  //console.log('Este es mi objeto JSON del author queries: '+resolvers.Query.authorQueries);
  loggerGlobal.debug('Antes de importar los resolvers ... ');
  export {resolvers};