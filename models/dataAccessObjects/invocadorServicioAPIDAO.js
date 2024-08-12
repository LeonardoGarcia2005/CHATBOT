import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';

const consultarParametrosEntradaServicioAPI_query = async (invocadorServicioId) => {

    loggerGlobal.info('el invocadorServicioId que me llego para consultar el servicio es: '+invocadorServicioId);
    if (!invocadorServicioId || isNaN(invocadorServicioId) || invocadorServicioId < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el invocadorServicioId para consultar los parametros del servicio a invocar');
    }

    //const values = [guionConversacionId];
    const query =  `SELECT  id,servicio_api_id,nombre_parametro_entrada,tipo_valor_de_variable_id,fecha_hora_registro,
                            registro_esta_activo
                    FROM	parametro_entrada_api
                    WHERE	servicio_api_id = ${invocadorServicioId}`;
    
    return query;
}

const consultarInvocadorServicioAPIPorId = async (invocadorServicioId) => {

    loggerGlobal.info('el invocadorServicioId que me llego para consultar el servicio es: '+invocadorServicioId);
    if (!invocadorServicioId || isNaN(invocadorServicioId) || invocadorServicioId < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el invocadorServicioId para consultar los datos del servicio a invocar');
    }

    let respuesta;

    try
    {
        const query =  `SELECT  nombre_del_servicio,url_api_invocar,metodo_invocacion,credenciales_en_BD,usuario_acceso_api,
                                clave_acceso_api, fecha_hora_registro,registro_esta_activo
                        FROM	invocador_servicio_api
                        WHERE	id = ${invocadorServicioId}`;
        
        respuesta = await dbConnectionProvider.task('consultarInvocadorServicioAPIPorId_Task', async t => {

            const servicioAPI = await t.one(query);
            if (servicioAPI){

                const urlServicio = servicioAPI.url_api_invocar;
                if (!urlServicio || urlServicio.length < 8 || urlServicio.slice(0,7) !== 'http://' || 
                    urlServicio.slice(0,8) !== 'https://'){
                    throw FabricaErrores.crearError(
                        FabricaErrores.TipoError.ErrorConfiguracionDatos,
                        'Debe especificar el invocadorServicioId para consultar los datos del servicio a invocar');
                }
            
                const queryParametros = await consultarParametrosEntradaServicioAPI_query(invocadorServicioId);

                let parametros = await t.manyOrNone(queryParametros);
                if (parametros instanceof Error){
                    return parametros;
                }

                servicioAPI.parametrosEntrada = parametros;
                return servicioAPI;
            }
        })
        .then(data => {
            loggerGlobal.debug('Respuesta en el task del metodo consultarInvocadorServicioAPIPorId de invocadorServicioAPIDAO: ');
            loggerGlobal.debug(data);
            return data;
        })
        .catch(error => {
            loggerGlobal.error('Error en el task del metodo consultarInvocadorServicioAPIPorId de invocadorServicioAPIDAO: ');
            loggerGlobal.error(error);
            return error;
        });

    }
    catch(error){
        loggerGlobal.error('Error al consultar un invocadorServicioAPI ...');
        loggerGlobal.error(error);
        return error;
    }
    
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar un invocadorServicioAPI ...');
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro el invocadorServicioAPI con id ${invocadorServicioId}`,respuesta);
        }
        else{
            if (respuesta instanceof ErrorConfiguracionDatos){
                throw respuesta;
            }
            else{
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorCapaDatos,
                    `Error en la capa de datos al intentar consultar el invocadorServicioAPI con id ${invocadorServicioId}`,respuesta);
            }
        }
    }

    //const respuesta = await connectDB.one(`select id,nombreguion,TO_CHAR(fechahoraregistro,'YYYY/MM/DD HH:MI:SS') as fechahoraregistro,TO_CHAR(fechahoraactualizacion,'YYYY/MM/DD HH:MI:SS') as fechahoraactualizacion from GUION_CONVERSACION where id=$1`,values);
    loggerGlobal.debug('Respuesta en el metodo consultarInvocadorServicioAPIPorId de invocadorServicioAPI: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

}

const InvocadorServicioAPIDAO = {
    consultarInvocadorServicioAPIPorId: consultarInvocadorServicioAPIPorId,   
}

export {InvocadorServicioAPIDAO};