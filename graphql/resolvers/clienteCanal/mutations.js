import {ClienteCanal} from '../../../models/businessObjects/clienteCanal.js'

const clienteCanalMutations = {
  insertaClienteCanal: async (_, {clienteCanalCreateInput}) => {
    console.log('entrando a la mutacion en clienteCanalMutations ...')
    return await ClienteCanal.insertaClienteCanal(clienteCanalCreateInput);
  },
};
  
export {clienteCanalMutations};