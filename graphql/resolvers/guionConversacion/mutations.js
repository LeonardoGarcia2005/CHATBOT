import {GuionConversacion} from '../../../models/businessObjects/guionConversacion.js'

const guionConversacionMutations = {
  crearGuionConversacion: async (_, args) => {},
  actualizarGuionConversacion: async (_, {id,guionConversacionUpdateInput}) => {
    console.log('entrando a la mutacion en GuionConversacion ...')
    return await GuionConversacion.actualizarUno(id,guionConversacionUpdateInput);
  },
};
  
export {guionConversacionMutations};