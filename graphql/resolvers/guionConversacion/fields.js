import {Empresa} from '../../../models/businessObjects/empresa.js'

const guionConversacionFields = {
    GuionConversacion: {
      empresa: async (guionConversacion,args,context) => {
          //console.log('el guionConversacion que me llego es: '+JSON.stringify(guionConversacion));
          //console.log('el context es: '+JSON.stringify(context));
          const empresaId = guionConversacion.empresa_id;
          console.log('la empresaId que me llego es: '+empresaId);
          return Empresa.consultarUno(empresaId);
          //return await context.datasources.empresasDataLoader.getEmpresaFor(empresaId);
      },
      /*canales: async (guionConversacion) => {
        return Canal.consultarCanales(guionConversacion.id);
      }*/
    },
};

  export {guionConversacionFields};