import {ClienteCanal} from '../../../models/businessObjects/clienteCanal.js'

const clienteQueries = {
    consultarClienteCanalPorIdentificador: async (_, {identificador_cliente, canal_id}) => {
        return await ClienteCanal.consultarClienteCanalPorIdentificador(identificador_cliente, canal_id);
    },
  };
  
  export {clienteQueries};