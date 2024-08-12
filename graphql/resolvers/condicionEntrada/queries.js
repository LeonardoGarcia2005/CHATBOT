import { GraphQLError } from 'graphql';
import {CondicionEntrada} from '../../../models/businessObjects/condicionEntrada.js'

const condicionEntradaQueries = {
    
    consultarCondicionEntradaPorFase: async (_, {fase_conversacion_id, secuencia_dentro_de_fase}) => {
        return await CondicionEntrada.consultarCondicionEntradaPorFase(fase_conversacion_id, secuencia_dentro_de_fase);
    },
    
    esCondicionEntradaValida: async (_, {fase_conversacion_id, secuencia_dentro_de_fase, entrada_de_cliente}) => {
        return await CondicionEntrada.esCondicionEntradaValida(fase_conversacion_id, secuencia_dentro_de_fase, entrada_de_cliente);
    },
    
};
  
export {condicionEntradaQueries};