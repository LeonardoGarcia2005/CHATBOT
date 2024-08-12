import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';

const consultarClienteChatbot_query = async (id) => {
    loggerGlobal.info('el id que me llego para consultar el clienteChatbot es: '+id);
    if (!id || isNaN(id) || id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar un id mayor que cero para consultar el clienteChatbot');
    }

    const query =  `SELECT  id,identificador_principal_cliente,tipo_identificador_id,nombre1,nombre2, 
                            apellido1,apellido2,correo,fecha_nacimiento,fecha_hora_primer_registro, 
                            fecha_hora_ultima_conversacion,fecha_hora_actualizacion,registro_esta_activo
                    FROM	cliente_chatbot
                    WHERE	id = ${id}`;
    
    //loggerGlobal.debug('el query para consultar el clienteChatbot es: ');
    //loggerGlobal.debug(query);

    return query;
}


const consultarClienteChatbot = async (id) => {

    let respuesta;
    try
    {
        const query = await consultarClienteChatbot_query(id);
        respuesta = await dbConnectionProvider.one(query);
    }
    catch(error){
        loggerGlobal.error(`Error al consultar el clienteChatbot con el id ${id}`);
        loggerGlobal.error(error);
        respuesta = error;
        //return error;
        /*if (errorConsulta instanceof dbConnectionProvider.pgpErrors.QueryResultError)
        {
            if (errorConsulta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro el clienteChatbot con el id ${id}`,
                    errorConsulta);
            }
        }
        throw errorConsulta;*/
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug('`No se encontro el clienteChatbot con el id '+id);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro el clienteChatbot con el id ${id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar el clienteChatbot con el id ${id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultarClienteChatbot de clienteChatbotDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}


const ClienteChatbotDAO = {
    consultarClienteChatbot: consultarClienteChatbot,
}

export {ClienteChatbotDAO};