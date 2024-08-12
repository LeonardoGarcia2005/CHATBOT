import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { EmpresaDAO } from '../dataAccessObjects/empresaDAO.js';

const consultaUno = async (id) => {
    return EmpresaDAO.consultarUno(id);
}

/*const consultaUno = async (id,empresasDataLoader) => {
    loggerGlobal.debug('recibi id: '+id);
    loggerGlobal.debug('recibi dataLoader: '+JSON.stringify(empresasDataLoader));
    return empresasDataLoader.getEmpresaFor(id);
}*/

const consultaTodos = async () => {
    return EmpresaDAO.consultarTodos();
}

const consultaVariosPorId = async (_,{ids},{datasources}) => {
    return datasources.empresasDataLoader.empresasArray(ids);
}

const Empresa = {
    consultarUno : consultaUno,
    consultarTodos: consultaTodos,
}

export {Empresa};