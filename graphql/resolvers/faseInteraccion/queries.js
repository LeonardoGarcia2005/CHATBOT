import {FaseInteraccion} from '../../../models/businessObjects/faseInteraccion.js'

const faseInteraccionQueries = {
    fasesInteraccion: async (_, args) => {
        return await FaseInteraccion.consultarTodos();
    },
    faseInteraccion: async (_, {id}) => {
        return await FaseInteraccion.consultarUno(id);
    },
  };
  
export {faseInteraccionQueries};