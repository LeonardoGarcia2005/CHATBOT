import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { GuionConversacionDAO } from '../dataAccessObjects/guionConversacionDAO.js';

const consultarGuion_CrearConversacion = async (id) => {
    
    return GuionConversacionDAO.consultarGuion_CrearConversacion(id);
}

const consultaTodos = async () => {
    return GuionConversacionDAO.consultarTodos();
}

const actualizaUno = async (id,guionConversacionUpdateInput) => {
    
    return GuionConversacionDAO.actualizarUno(id,guionConversacionUpdateInput);
}

const GuionConversacion = {
    consultarGuion_CrearConversacion : consultarGuion_CrearConversacion,
    consultarTodos: consultaTodos,
    actualizarUno: actualizaUno,
}

export {GuionConversacion};