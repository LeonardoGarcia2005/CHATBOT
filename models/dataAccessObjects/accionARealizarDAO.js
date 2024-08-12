import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { FabricaErrores } from '../errors/errorsManager.js';

const consultarAccionesARealizarPorEntrada = async (condicion_entrada_id) => {
    
    if (!condicion_entrada_id || isNaN(condicion_entrada_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el condicion_entrada_id para consultar las acciones a realizar');
    }

    loggerGlobal.info('el condicion_entrada_id que me llego para buscar las acciones a realizar es: '+condicion_entrada_id);
    if (condicion_entrada_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El condicion_entrada_id para consultar las acciones a realizar debe ser mayor que cero');
    }

    let respuesta;

    try
    {
        //const values = [id];
        const query =  `SELECT  id,condicion_entrada_id,nombre_accion_realizar,tipo_accion_id, servicio_api_id, 
                                requiere_ejecucion_exitosa,fecha_hora_registro,fecha_hora_actualizacion, registro_esta_activo
                        FROM 	accion_a_realizar 
                        WHERE 	condicion_entrada_id = ${condicion_entrada_id}
                        AND 	registro_esta_activo = true`;

        respuesta = await dbConnectionProvider.manyOrNone(query);

    }
    catch(error){
        loggerGlobal.error('Error al consultar una consultarAccionesARealizarPorEntrada ...');
        loggerGlobal.error(error);
        return error;
    }
    
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar las Acciones a realizar por Entrada ...');
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontraron las Acciones a realizar por condicion_entrada_id ${condicion_entrada_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar las Acciones a realizar por condicion_entrada_id ${condicion_entrada_id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultarAccionesARealizarPorEntrada de accionARealizarDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

};

const AccionARealizarDAO = {
    consultarAccionesARealizarPorEntrada: consultarAccionesARealizarPorEntrada
}

export {AccionARealizarDAO};