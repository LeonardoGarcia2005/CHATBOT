import {Canal} from '../../../models/businessObjects/canal.js'

const clienteCanalFields = {
    ClienteCanal: {
      canal: async (clienteCanal) => {
            const canalId = clienteCanal.canal_id;
            console.log('la canalId que me llego es: '+canalId);
            return await Canal.consultaCanal(canalId);
      },
    },
};

  export {clienteCanalFields};