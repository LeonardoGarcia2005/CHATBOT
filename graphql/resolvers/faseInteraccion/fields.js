import {FaseConversacion} from '../../../models/businessObjects/faseConversacion.js'
import { loggerGlobal } from '../../../globalServices/logging/loggerManager.js';

const faseInteraccionFields = {
  FaseInteraccion: {
      fase_conversacion: async (faseInteraccion) => {
            const faseConversacionId = faseInteraccion.fase_conversacion_id;
            loggerGlobal.debug('fase_conversacion_id que me llego es: '+faseConversacionId);
            return await FaseConversacion.consultaParaFaseInteraccion(faseConversacionId);
      },
    },
};

  export {faseInteraccionFields};