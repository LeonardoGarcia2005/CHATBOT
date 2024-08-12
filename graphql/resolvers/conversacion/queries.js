//import {Conversacion} from './../../../models/guionConversacion.js'

const conversacionQueries = {
    conversaciones: async (_, args) => {
        //return Conversacion.consultarTodos();
    },
    conversacion: async (_, {id}) => {
        //return Conversacion.consultarUno(id);
    },
  };
  
export {conversacionQueries};