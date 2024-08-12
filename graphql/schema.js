import { readdirSync, readFileSync } from 'fs';
import {resolvers} from './resolvers/resolversIndex.js'
import { loggerGlobal } from '../globalServices/logging/loggerManager.js';

let typeDefs = '';

const gqlFiles = readdirSync(new URL('./typedefs',import.meta.url));

gqlFiles.forEach((file) => {
  loggerGlobal.debug('el archivo iterado es: '+file);
  const archivo = new URL('./typedefs/'+file,import.meta.url);
  //console.log('archivo es: '+archivo);
  typeDefs += readFileSync(archivo, {
      encoding: 'utf8',
  });
});
//console.log('typedefs es: '+typeDefs);

const resolversGot = resolvers;

const schema={
    typeDefs:typeDefs,
    resolvers:resolversGot,
 };

 //export default schema;
 export {schema};