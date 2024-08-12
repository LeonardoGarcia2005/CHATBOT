import {Canal} from '../../../models/businessObjects/canal.js'

const canalQueries = {
    canal: async (_, {id}) => {
        return await Canal.consultaCanal(id);
    },
  };
  
  export {canalQueries};