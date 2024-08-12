import {Empresa} from '../../../models/businessObjects/empresa.js'

const empresaQueries = {
    empresas: async (_, args) => {
        return await Empresa.consultarTodos();
    },
    empresa: async (_, {id},context) => {

        //loggerGlobal.debug('recibi context: '+JSON.stringify(context));
        //return await context.datasources.empresasDataLoader.getEmpresaFor(id);
        return Empresa.consultarUno(id);

        //OJO: el siguiente bloque comentado no funciona ...
        /*connectDB.one(`select id,nombre,createdAt,updatedAt from AUTHOR where id=$1`,values)
            .then(data => {
                console.log('Respuesta en el resolver de author (metodo one): ');
                console.log('la respuesta a one es: '+data);
            });*/
    },
  };
  
  export {empresaQueries};