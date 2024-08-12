import {FabricaErrores} from '../errors/errorsManager.js'
import {ErrorDatosNoEncontrados} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { ClienteCanalDAO } from '../dataAccessObjects/clienteCanalDAO.js';
import { ClienteChatbotDAO } from '../dataAccessObjects/clienteChatbotDAO.js';

const consultarClienteCanalPorIdentificador = async (identificadorClienteEnCanal,canalId) => {
    return ClienteCanalDAO.consultarClienteCanalPorIdentificador(identificadorClienteEnCanal,canalId);
}

const consultarClienteCanal = async (cliente_canal_id) => {
    return ClienteCanalDAO.consultarClienteCanal(cliente_canal_id);
}

const insertaClienteCanal = async (clienteCanalCreateInput) => {
    return ClienteCanalDAO.insertaClienteCanal(clienteCanalCreateInput);
}

const getClienteCanal = async(identificadorCliente,canal_id) => {
    let clienteCanal = null;

    try{
        clienteCanal = await ClienteCanalDAO.consultarClienteCanalPorIdentificador(identificadorCliente,canal_id);
        if (clienteCanal && clienteCanal.cliente_chatbot_id){
            clienteCanal.cliente_chatbot = await ClienteChatbotDAO.consultarClienteChatbot(clienteCanal.cliente_chatbot_id);
        }
    }
    catch(error){
        if (error instanceof ErrorDatosNoEncontrados)
        {
            clienteCanal = null;
        }
        else throw error;

    }
    return clienteCanal;
}



const ClienteCanal = {
    getClienteCanal: getClienteCanal,
    consultarClienteCanal : consultarClienteCanal,
    consultarClienteCanalPorIdentificador: consultarClienteCanalPorIdentificador,
    insertaClienteCanal: insertaClienteCanal,
}

export {ClienteCanal};