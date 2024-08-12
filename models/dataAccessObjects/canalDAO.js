import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';


const consultaCanalesDeGuion_query = (guionConversacionId) => {
    if (!guionConversacionId || isNaN(guionConversacionId)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el guionConversacionId para esta consulta');
    }

    loggerGlobal.info('el guionConversacionId que me llego para buscar los canales es: '+guionConversacionId);
    if (guionConversacionId < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El guionConversacionId para consultar los canales debe ser mayor que cero');
    }

    //const values = [guionConversacionId];
    const query = `SELECT       c.id,c.nombre_canal,c.admite_identificador_cliente_null,c.fecha_hora_registro,c.fecha_hora_actualizacion,c.registro_esta_activo 
                   FROM         canal c
                   INNER JOIN 	guion_canal gc
                   ON 			c.id = gc.canal_id
                   WHERE        gc.guion_conversacion_id=${guionConversacionId}`;
    
    return query;
}


const consultaCanalesDeGuion = async (guionConversacionId) => {

    let respuesta;

    try
    {
        const query = consultaCanalesDeGuion_query(guionConversacionId);
        respuesta = await dbConnectionProvider.many(query,values);

    }
    catch(error){
        loggerGlobal.error('Error al consultar el canal de la Conversacion ...');
        loggerGlobal.error(error);
        respuesta = error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar los canales del GuionConversacion '+guionConversacionId);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorConfiguracionDatos,
                    `El GuionConversacion con id ${guionConversacionId} no tiene canales registrados`);
    }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar los canales para el GuionConversacion ${guionConversacionId}`,respuesta);
        }
    }
    
    loggerGlobal.debug('Respuesta en el metodo consultaCanalesDeGuion de canalDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const consultaCanalDeConversacion = async (conversacionId) => {

    if (!conversacionId){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el conversacionId para consultar el canal de la conversacion');
    }
    let respuesta;

    try
    {
        const values = [conversacionId];
        const query =  `SELECT  ca.id,ca.nombre_canal,ca.admite_identificador_cliente_null
                        FROM 	conversacion co
                        INNER JOIN canal ca
                        ON 		co.canal_id = ca.id
                        WHERE 	co.id = ${conversacionId} 
                        AND		ca.registro_esta_activo = true`;

        respuesta = await dbConnectionProvider.One(query,values);

    }
    catch(error){
        loggerGlobal.error('Error al consultar el canal de la Conversacion ...');
        loggerGlobal.error(error);
        return error;
        /*if (error instanceof dbConnectionProvider.pgpErrors.QueryResultError)
        {
            if (error.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    'No se encontro el canal para el conversacion_id '+conversacionId,
                    errorConsulta);
            }
        }
        throw errorConsulta;*/
    }
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar el canal de la conversacion '+conversacionId);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro el canal de la conversacion ${conversacionId}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar el canal de la conversacion ${conversacionId}`,respuesta);
        }
    }
    
    //const respuesta = await connectDB.one(`select id,nombreguion,TO_CHAR(fechahoraregistro,'YYYY/MM/DD HH:MI:SS') as fechahoraregistro,TO_CHAR(fechahoraactualizacion,'YYYY/MM/DD HH:MI:SS') as fechahoraactualizacion from GUION_CONVERSACION where id=$1`,values);
    loggerGlobal.debug('Respuesta en el metodo consultaCanalDeConversacion de canalDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}


const consultaCanal = async (id) => {

    try
    {
        const values = [id];
        const query = `SELECT       id,nombre_canal,fecha_hora_registro,fecha_hora_actualizacion,registro_esta_activo 
                        FROM        canal
                        WHERE       id=${id}`;

        const respuesta = await dbConnectionProvider.oneOrNone(query,values);
        loggerGlobal.debug('Respuesta en el metodo consultaCanal de canalDAO: ');
        loggerGlobal.debug(respuesta);
        return respuesta;

    }catch(errorConsulta){
        if (errorConsulta instanceof dbConnectionProvider.pgpErrors.QueryResultError)
        {
            if (errorConsulta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    'No se encontro el canal con Id '+id,
                    errorConsulta);
            }
        }
        throw errorConsulta;
    }
}


const CanalDAO = {
    consultaCanal: consultaCanal,
    consultaCanalesDeGuion : consultaCanalesDeGuion,
    consultaCanalesDeGuion_query : consultaCanalesDeGuion_query,
    consultaCanalDeConversacion: consultaCanalDeConversacion,
}

export {CanalDAO};