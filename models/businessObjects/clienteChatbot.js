import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { ClienteChatbotDAO } from '../dataAccessObjects/clienteChatbotDAO.js';

const consultarClienteChatbot = async (id) => {
    return ClienteChatbotDAO.consultarClienteChatbot(id);
}

const ClienteChatbot = {
    consultarClienteChatbot : consultarClienteChatbot,
}

export {ClienteChatbot};