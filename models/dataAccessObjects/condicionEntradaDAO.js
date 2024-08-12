import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { FabricaErrores } from '../errors/errorsManager.js';


const consultarCondicionEntradaPorFase = async (fase_conversacion_id, secuenciaDeCondicionEntrada) => {
    
    if (!fase_conversacion_id || isNaN(fase_conversacion_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el fase_conversacion_id para consultar la condicion de entrada');
    }

    loggerGlobal.info('el fase_conversacion_id que me llego para buscar la condicion de entrada es: '+fase_conversacion_id);
    if (fase_conversacion_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El fase_conversacion_id para consultar la condicion de entrada debe ser mayor que cero');
    }

    if (!secuenciaDeCondicionEntrada || isNaN(secuenciaDeCondicionEntrada)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar la secuencia para consultar la condicion de entrada');
    }

    if (secuenciaDeCondicionEntrada < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'La secuencia para consultar la condicion de entrada debe ser mayor que cero');
    }

    let respuesta;

    try
    {
        //const values = [id];
        const query =  `SELECT  id,fase_conversacion_id,secuencia_dentro_de_fase,tipo_mensaje_entrada_id, expresion_regular_activadora, 
                                valor_dato_constante,formato_de_valor_entrada,palabras_clave_reconocer,es_entrada_repetitiva, 
                                guion_conversacion_id,es_entrada_para_abortar, proxima_fase_conversacion_id
                        FROM 	condicion_entrada 
                        WHERE 	fase_conversacion_id = ${fase_conversacion_id}
                        AND		secuencia_dentro_de_fase = ${secuenciaDeCondicionEntrada}
                        AND 	registro_esta_activo = true`;

        respuesta = await dbConnectionProvider.one(query);

    }
    catch(error){
        loggerGlobal.error('Error al consultar una CondicionEntrada ...');
        loggerGlobal.error(error);
        return error;
    }
    
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar una CondicionEntrada ...');
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro la CondicionEntrada con faseId ${fase_conversacion_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar la CondicionEntrada con faseId ${fase_conversacion_id}`,respuesta);
        }
    }

    //const respuesta = await connectDB.one(`select id,nombreguion,TO_CHAR(fechahoraregistro,'YYYY/MM/DD HH:MI:SS') as fechahoraregistro,TO_CHAR(fechahoraactualizacion,'YYYY/MM/DD HH:MI:SS') as fechahoraactualizacion from GUION_CONVERSACION where id=$1`,values);
    loggerGlobal.debug('Respuesta en el metodo consultarCondicionEntradaPorFase de condicionEntrada: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

}


const consultarCondicionesEntradaPorFase = async (fase_conversacion_id) => {
    
    if (!fase_conversacion_id || isNaN(fase_conversacion_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el fase_conversacion_id para consultar la condicion de entrada');
    }

    loggerGlobal.info('el fase_conversacion_id que me llego para buscar la condicion de entrada es: '+fase_conversacion_id);
    if (fase_conversacion_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El fase_conversacion_id para consultar la condicion de entrada debe ser mayor que cero');
    }

    let respuesta;

    try
    {
        //const values = [id];
        const query =  `SELECT  id,fase_conversacion_id,secuencia_dentro_de_fase,tipo_mensaje_entrada_id, expresion_regular_activadora, 
                                valor_dato_constante,formato_de_valor_entrada,palabras_clave_reconocer,es_entrada_repetitiva, 
                                guion_conversacion_id,es_entrada_para_abortar, proxima_fase_conversacion_id
                        FROM 	condicion_entrada 
                        WHERE 	fase_conversacion_id = ${fase_conversacion_id}
                        AND 	registro_esta_activo = true
                        ORDER BY secuencia_dentro_de_fase`;

        respuesta = await dbConnectionProvider.many(query);

    }
    catch(error){
        loggerGlobal.error('Error al consultar una CondicionEntrada ...');
        loggerGlobal.error(error);
        return error;
    }
    
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar las Condiciones de Entrada ...');
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontraron las Condiciones de Entrada para la faseId ${fase_conversacion_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar las Condiciones de Entrada para la faseId ${fase_conversacion_id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultarCondicionesEntradaPorFase de condicionEntrada: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

}


//Se ASUME que esta condicion de entrada es valida para cualquier fase de la conversación, y sirve
//para que la conversación se reinicie, y vuelva al menu principal inicial.
const consultarCondicionEntradaParaAbortar = async (guion_conversacion_id) => {
    
    if (!guion_conversacion_id || isNaN(guion_conversacion_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el guion_conversacion_id para consultar la condicion de entrada');
    }

    loggerGlobal.info('el guion_conversacion_id que me llego para buscar la condicion de entrada para abortar, es: '+guion_conversacion_id);
    if (guion_conversacion_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El guion_conversacion_id para consultar la condicion de entrada debe ser mayor que cero');
    }

    let respuesta;

    try
    {
        //const values = [id];
        const query =  `SELECT  id,tipo_mensaje_entrada_id, valor_dato_constante,
                                guion_conversacion_id,es_entrada_para_abortar,
                                registro_esta_activo, proxima_fase_conversacion_id
                        FROM 	condicion_entrada 
                        WHERE 	guion_conversacion_id = ${guion_conversacion_id}
                        AND 	registro_esta_activo = true
                        AND 	es_entrada_para_abortar = true`;

        respuesta = await dbConnectionProvider.one(query);

    }
    catch(error){
        loggerGlobal.error('Error al consultar una CondicionEntrada para abortar...');
        loggerGlobal.error(error);
        respuesta = error;
    }
    
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar consultar las Condiciones de Entrada para abortar...');
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontraron las Condiciones de Entrada para abortar para el guion_conversacion_id ${fase_conversacion_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar las Condiciones de Entrada  para abortar para el guion_conversacion_id ${fase_conversacion_id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultarCondicionEntradaParaAbortar de condicionEntrada: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

}


const CondicionEntradaDAO = {
    consultarCondicionEntradaPorFase: consultarCondicionEntradaPorFase,
    consultarCondicionesEntradaPorFase: consultarCondicionesEntradaPorFase,
    consultarCondicionEntradaParaAbortar: consultarCondicionEntradaParaAbortar,
}

export {CondicionEntradaDAO};