import { GraphQLError } from 'graphql';
import {FaseConversacion} from '../../../models/businessObjects/faseConversacion.js'

const faseConversacionQueries = {
    
    /*fasesConversacion: async (_, args) => {
        return GuionConversacion.consultarTodos();
    },*/
    
    fasesConversacionHastaNivel1: async (_, {guion_conversacion_id}) => {
        return await FaseConversacion.consultafasesConversacionHastaNivel1(guion_conversacion_id);
    },
    
    /*faseConversacion: async (_, {id}) => {
        return GuionConversacion.consultarUno(id);
    },*/
  };
  
export {faseConversacionQueries};