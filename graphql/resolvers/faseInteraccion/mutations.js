import {FaseInteraccion} from '../../../models/businessObjects/faseInteraccion.js'

const faseInteraccionMutations = {
  crearFaseInteraccion: async (_, {faseInteraccionCreateInput,conversacionId}) => {
    console.log('entrando a la mutacion en crearFaseInteraccion ...')
    return await FaseInteraccion.insertarUno(faseInteraccionCreateInput,conversacionId);
  },
  actualizarFaseInteraccion: async (_, {id,conversacionUpdateInput}) => {
    //console.log('entrando a la mutacion en Conversacion ...')
    //return FaseInteraccion.actualizarUno(id,conversacionUpdateInput);
  },
  asociarFaseInteraccionAConversacion: async (_, args) => {},
};
  
export {faseInteraccionMutations};