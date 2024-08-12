import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { CanalDAO } from '../dataAccessObjects/canalDAO.js';

const consultaCanal = async (id) => {
    return CanalDAO.consultaCanal(id);
}

const consultaCanalesDeGuion = async () => {
    return CanalDAO.consultaCanalesDeGuion();
}

const consultaCanalDeConversacion = async (conversacionId) => {
    return CanalDAO.consultaCanalDeConversacion(conversacionId);
}

const Canal = {
    consultaCanal : consultaCanal,
    consultaCanalesDeGuion: consultaCanalesDeGuion,
    consultaCanalDeConversacion: consultaCanalDeConversacion,
}

export {Canal};