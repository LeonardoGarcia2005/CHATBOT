import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import { FabricaErrores } from '../errors/errorsManager.js';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';

const consultaFaseYSiguienteNivel_query = async (fase_conversacion_id) => {
    if (!fase_conversacion_id || isNaN(fase_conversacion_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el id para consultar la FaseConversacion');
    }

    loggerGlobal.info('el fase_conversacion_id que me llego para buscar la fase es: '+fase_conversacion_id);
    if (fase_conversacion_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El id para consultar FaseConversacion debe ser mayor que cero');
    }

    //Este Query solo trae la fase conversacion indicada por su id y sus nodos hijos ...
    const columnas = ` id,guion_conversacion_id,nombre_fase,nivel_nodo,fase_padre_id,mensaje_de_fase,
                        mensaje_entrada_invalida,tiempo_limite_sesion,es_de_operador,area_empresa_id,es_fase_inicial_cliente,
                        fecha_hora_registro,fecha_hora_actualizacion,registro_esta_activo `;
    const columnasCualificadas = ` fc.id,fc.guion_conversacion_id,fc.nombre_fase,fc.nivel_nodo,fc.fase_padre_id,fc.mensaje_de_fase,
                        fc.mensaje_entrada_invalida,fc.tiempo_limite_sesion,fc.es_de_operador,fc.area_empresa_id,fc.es_fase_inicial_cliente,
                        fc.fecha_hora_registro,fc.fecha_hora_actualizacion,fc.registro_esta_activo `;

    const queryRecursivo = 
                `WITH RECURSIVE ramaFases AS (
                    SELECT  ${columnas} 
                    FROM    fase_conversacion 
                    WHERE   id=${fase_conversacion_id} 
                    UNION 
                        SELECT  ${columnasCualificadas} 
                        FROM    fase_conversacion fc 
                        INNER JOIN ramaFases rf ON rf.id = fc.fase_padre_id 
                )   SELECT  * 
                    FROM    ramaFases`;
    
        //loggerGlobal.debug('El query a retornar es: '+queryRecursivo);

    return queryRecursivo;

};


const consultaFaseYSiguienteNivel = async (fase_conversacion_id) => {
    let respuesta;
    try
    {
        const values = [fase_conversacion_id];
    
        const queryRecursivo = await consultaFaseYSiguienteNivel_query(fase_conversacion_id);

        respuesta = await dbConnectionProvider.task('taskRamaFases', t =>{
            return t.manyOrNone(queryRecursivo)
            .then(fases => {
                loggerGlobal.debug('Obtuve las fases en el task de consultaFaseYSiguienteNivel');
                return fases;
            });
        });

    }
    catch(error){
        loggerGlobal.error(`Error al consultar consultaFaseYSiguienteNivel con el fase_conversacion_id ${fase_conversacion_id}`);
        loggerGlobal.error(error);
        return error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug('`No se encontro una fase con el fase_conversacion_id '+fase_conversacion_id);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro una fase con el fase_conversacion_id ${fase_conversacion_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar las fases de conversacion con el fase_conversacion_id ${fase_conversacion_id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultaFaseYSiguienteNivel: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}


const consultafasesConversacionHastaNivel1_query = async (guion_conversacion_id) => {
    if (!guion_conversacion_id || isNaN(guion_conversacion_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el id para consultar GuionConversacion');
    }

    loggerGlobal.info('el id de guion que me llego para buscar las fases es: '+guion_conversacion_id);
    if (guion_conversacion_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El id para consultar GuionConversacion debe ser mayor que cero');
    }

    const columnas = ` id,guion_conversacion_id,nombre_fase,nivel_nodo,fase_padre_id,mensaje_de_fase,
                        mensaje_entrada_invalida,tiempo_limite_sesion,es_de_operador,area_empresa_id,es_fase_inicial_cliente,
                        fecha_hora_registro,fecha_hora_actualizacion,registro_esta_activo `;
    const columnasCualificadas = ` fc.id,fc.guion_conversacion_id,fc.nombre_fase,fc.nivel_nodo,fc.fase_padre_id,fc.mensaje_de_fase,
                        fc.mensaje_entrada_invalida,fc.tiempo_limite_sesion,fc.es_de_operador,fc.area_empresa_id,fc.es_fase_inicial_cliente,
                        fc.fecha_hora_registro,fc.fecha_hora_actualizacion,fc.registro_esta_activo `;

    const queryRecursivo = 
                `WITH RECURSIVE arbolFases AS (
                    SELECT  ${columnas} 
                    FROM    fase_conversacion 
                    WHERE   guion_conversacion_id=${guion_conversacion_id} AND nivel_nodo = 0
                    UNION 
                        SELECT  ${columnasCualificadas} 
                        FROM    fase_conversacion fc 
                        INNER JOIN arbolFases af ON af.id = fc.fase_padre_id 
                )   SELECT  * 
                    FROM    arbolFases 
                    WHERE   nivel_nodo <= 1`;
    
        //loggerGlobal.debug('El query a retornar es: '+queryRecursivo);

    return queryRecursivo;

};


const consultafasesConversacionHastaNivel1 = async (guion_conversacion_id) => {
    let respuesta;
    try
    {
        const values = [guion_conversacion_id];
    
        const queryRecursivo = await consultafasesConversacionHastaNivel1_query(guion_conversacion_id);

        respuesta = await dbConnectionProvider.task('taskContarFases', t =>{
            return t.manyOrNone(queryRecursivo)
            .then(fases => {
                loggerGlobal.debug('Obtuve las fases en el task de consultafasesConversacionHastaNivel1');
                return fases;
            });
        });

    }
    catch(error){
        loggerGlobal.error(`Error al consultar fasesConversacionHastaNivel1 con el guion_conversacion_id ${guion_conversacion_id}`);
        loggerGlobal.error(error);
        return error;
        /*if (errorConsulta instanceof dbConnectionProvider.pgpErrors.QueryResultError)
        {
            if (errorConsulta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    'No se encontraron fases de conversacion con el guion_conversacion_id '+id,
                    errorConsulta);
            }
        }
        throw errorConsulta;*/
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug('`No se encontraron fases de conversacion con el guion_conversacion_id '+guion_conversacion_id);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontraron fases de conversacion con el guion_conversacion_id ${guion_conversacion_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar las fases de conversacion con el guion_conversacion_id ${guion_conversacion_id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultafasesConversacionHastaNivel1: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const consultaParaFaseInteraccion_query = async (fase_conversacion_id) => {
    if (!fase_conversacion_id || isNaN(fase_conversacion_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el id para consultar la FaseConversacion');
    }

    loggerGlobal.info('el fase_conversacion_id que me llego para buscar la fase es: '+fase_conversacion_id);
    if (fase_conversacion_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'El id para consultar FaseConversacion debe ser mayor que cero');
    }

    const columnas = ` id,guion_conversacion_id,nombre_fase,nivel_nodo,fase_padre_id,mensaje_de_fase,
                        mensaje_entrada_invalida,tiempo_limite_sesion,es_de_operador,area_empresa_id,es_fase_inicial_cliente,
                        requiere_autenticacion,fecha_hora_registro,fecha_hora_actualizacion,registro_esta_activo `;

    const queryFase = 
                `   SELECT  ${columnas} 
                    FROM    fase_conversacion 
                    WHERE   id=${fase_conversacion_id} 
                    `;
    
        //loggerGlobal.debug('El query a retornar es: '+queryFase);

    return queryFase;

};


const consultaParaFaseInteraccion = async (fase_conversacion_id) => {
    let respuesta;
    try
    {
        const values = [fase_conversacion_id];
    
        const query = await consultaParaFaseInteraccion_query(fase_conversacion_id);

        respuesta = await dbConnectionProvider.task('taskParaFaseInteraccion', t =>{
            return t.one(query)
            .then(fases => {
                loggerGlobal.debug('Obtuve la fase en el task de consultaParaFaseInteraccion');
                return fases;
            });
        });

    }
    catch(error){
        loggerGlobal.error(`Error al consultar consultaParaFaseInteraccion con el fase_conversacion_id ${fase_conversacion_id}`);
        loggerGlobal.error(error);
        respuesta = error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug('`No se encontro una fase con el fase_conversacion_id '+fase_conversacion_id);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro una fase con el fase_conversacion_id ${fase_conversacion_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar la fases de conversacion con el fase_conversacion_id ${fase_conversacion_id}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultaParaFaseInteraccion: ');
    loggerGlobal.debug(respuesta);
    //loggerGlobal.debug('FaseConversacion.nombre: '+respuesta.nombre_fase);
    return respuesta;
}


const FaseConversacionDAO = {
    consultafasesConversacionHastaNivel1 : consultafasesConversacionHastaNivel1,
    consultafasesConversacionHastaNivel1_query: consultafasesConversacionHastaNivel1_query,
    consultaFaseYSiguienteNivel_query: consultaFaseYSiguienteNivel_query,
    consultaFaseYSiguienteNivel: consultaFaseYSiguienteNivel,
    consultaParaFaseInteraccion_query: consultaParaFaseInteraccion_query,
    consultaParaFaseInteraccion : consultaParaFaseInteraccion,
};

export {FaseConversacionDAO};