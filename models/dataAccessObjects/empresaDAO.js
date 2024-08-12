import {dbConnectionProvider} from '../db/dbConnectionManager.js';
import {FabricaErrores} from '../errors/errorsManager.js';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';

const consultaUno_query = async (id) => {
    if (!id || isNaN(id) || id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar un id valido para consultar la empresa');
    }

    const query = `select id,nombre_empresa,uid,fecha_hora_registro,fecha_hora_actualizacion from EMPRESA where id=${id}`;
    return query;
}

const consultaUno = async (id) => {
    
    let respuesta;
    try{
        loggerGlobal.info('el id que me llego para buscar la empresa es: '+id);
        const query = await consultaUno_query(id);
        respuesta = await dbConnectionProvider.one(query);
    }
    catch(error){
        loggerGlobal.error(`Error al consultar la empresa con el id ${id}`);
        loggerGlobal.error(error);
        return error;
        /*if (errorConsulta instanceof dbConnectionProvider.pgpErrors.QueryResultError)
        {
            if (errorConsulta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    'No se encontro la empresa con id '+id,
                    errorConsulta);
            }
        }
        throw errorConsulta;*/
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug('`No se encontro la empresa con el id '+id);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro la empresa con el id ${id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar la empresa con el id ${id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultaUno de empresaDAO ...');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const consultaTodos = async () => {
    loggerGlobal.debug('entrando a consultarTodos ... ');
    const respuesta = await dbConnectionProvider.manyOrNone(`select id,nombre_empresa,uid,TO_CHAR(fecha_hora_registro,'YYYY/MM/DD HH:MI:SS') as fecha_hora_registro,TO_CHAR(fecha_hora_actualizacion,'YYYY/MM/DD HH:MI:SS') as fecha_hora_actualizacion from EMPRESA`);
    loggerGlobal.debug('Respuesta en el metodo consultarTodos... ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const EmpresaDAO = {
    consultarUno : consultaUno,
    consultaUno_query: consultaUno_query,
    consultarTodos: consultaTodos,
}

export {EmpresaDAO};