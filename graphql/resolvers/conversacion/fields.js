import {GuionConversacion} from '../../../models/businessObjects/guionConversacion.js'
import {ClienteCanal} from '../../../models/businessObjects/clienteCanal.js'

const conversacionFields = {
    Conversacion: {
      guion_conversacion: async (conversacion) => {
            const guionconversacionId = conversacion.guion_conversacion_id;
            console.log('guionconversacionId que me llego es: '+guionconversacionId);
            return await GuionConversacion.consultarUno(guionconversacionId);
      },
      cliente_canal: async (conversacion) => {
        const cliente_canal_id = conversacion.cliente_canal_id;
        console.log('cliente_canal_id que me llego es: '+cliente_canal_id);
        return await ClienteCanal.consultarClienteCanalPorIdentificador(cliente_canal_id);
      },
    },
};

  export {conversacionFields};