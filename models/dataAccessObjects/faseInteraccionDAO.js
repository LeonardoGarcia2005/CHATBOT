import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import { FabricaErrores } from '../errors/errorsManager.js';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';


let columnasInsertFaseInteraccion;
let columnaFechaHoraMensajeTareaMostrado;
let columnasUpdateCondicionEntradaEnFase;

if (!columnasInsertFaseInteraccion){
    //Se crean aqui, estaticamente, para crearlas solo 1 vez y mejorar performance 
    loggerGlobal.debug('voy a crear el ColumnSet en FaseInteraccion...');

    const Column = dbConnectionProvider.helpers.Column;
    columnaFechaHoraMensajeTareaMostrado = new Column({
        name:'fecha_hora_mensaje_tarea_mostrado',
        mod:'^',
        def:'current_timestamp'
    });

    const columnaFechaHoraCondicionEntradaRecibida = new Column({
        name:'fecha_hora_condicion_entrada_recibida',
        mod:'^',
        def:'current_timestamp'
    });

    columnasInsertFaseInteraccion = new dbConnectionProvider.helpers.ColumnSet(
        ['fase_conversacion_id',
        'conversacion_id',
        //'guionCanalId',
        //'secuencia_en_conversacion',
        columnaFechaHoraMensajeTareaMostrado,
        'registro_esta_activo',
        ],
        {table:'fase_interaccion'});

    columnasUpdateCondicionEntradaEnFase = new dbConnectionProvider.helpers.ColumnSet(
        ['?id',
        '?registro_esta_activo',
        'condicion_entrada_recibida_id',
        columnaFechaHoraCondicionEntradaRecibida,
        'fue_entrada_para_abortar',
        ],
        {table:'fase_interaccion'});
}

const consultaUno = async (id) => {
    loggerGlobal.info('el id que me llego para buscar la faseInteraccion es: '+id);
    const values = [id];
    const respuesta = await dbConnectionProvider.one(`select id,fase_conversacion_id,conversacion_id,guion_canal_id,secuencia_en_conversacion,fecha_hora_mensaje_tarea_mostrado,condicion_entrada_recibida_Id,fecha_hora_condicion_entrada_recibida,registro_esta_activo from FASE_INTERACCION where id=$1`,values);
    loggerGlobal.debug('Respuesta en el metodo consultaUno de faseInteraccion: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const consultaTodos = async () => {
    const respuesta = await dbConnectionProvider.manyOrNone(`id,fase_conversacion_id,conversacion_id,guion_canal_id,secuencia_en_conversacion,fecha_hora_mensaje_tarea_mostrado,condicion_entrada_recibida_Id,fecha_hora_condicion_entrada_recibida,registro_esta_activo from FASE_INTERACCION`);
    loggerGlobal.debug('Respuesta en el metodo consultaTodos de faseInteraccion: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const insertaUno = async (faseInteraccionCreateInput,conversacionId) => {
    loggerGlobal.debug('el conversacionId que me llego para registrar la faseInteraccion es: '+conversacionId);
    loggerGlobal.debug('objeto faseInteraccionCreateInput: ',faseInteraccionCreateInput);

    try{
        const values = [{conversacionid:conversacionId,
                        secuenciaenconversacion:faseInteraccionCreateInput.secuenciaenconversacion,
                        //condicionentradarecibida:faseInteraccionCreateInput.condicionentradarecibida,
                        registroestaactivo:faseInteraccionCreateInput.registroestaactivo,
                        
                    }];
        const datosRetorno = 'id,fase_conversacion_id,conversacion_id,guion_canal_id,secuencia_en_conversacion,fecha_hora_mensaje_tarea_mostrado,condicion_entrada_recibida_Id,fecha_hora_condicion_entrada_recibida,registro_esta_activo';
        const query = dbConnectionProvider.helpers.insert(values,columnasInsertFaseInteraccion)+' RETURNING '+datosRetorno;
        const respuesta = await dbConnectionProvider.oneOrNone(query);
        //QUERY generado: INSERT INTO "fase_interaccion"("conversacionid","secuenciaenconversacion","fechahoramensajetareamostrado","fechahoracondicionentradarecibida","registroestaactivo") VALUES('3',1,current_timestamp,current_timestamp,true) RETURNING id,faseconversacionid,conversacionid,guioncanalid,secuenciaenconversacion,fechahoramensajetareamostrado,condicionentradarecibidaId,fechahoracondicionentradarecibida,registroestaactivo

        loggerGlobal.debug('Respuesta en el metodo insertaUno de faseInteraccion: ');
        loggerGlobal.debug(respuesta);
        return respuesta;

    }catch(error){
        loggerGlobal.error('Error al insertar faseInteraccion ...');
        loggerGlobal.error(error);
        return null;
    }
}

const insertaFasesInteraccion_query = async (fasesInteraccionCreateInput) => {

    if (!fasesInteraccionCreateInput || !Array.isArray(fasesInteraccionCreateInput) || fasesInteraccionCreateInput.length < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar al menos 1 fase de Interaccion para insertar');
    }

    const conversacionId = fasesInteraccionCreateInput[0].conversacion_id;
    loggerGlobal.debug('el conversacionId que me llego para query de insercion faseInteraccion es: '+conversacionId);
    loggerGlobal.debug('cantidad de fases para insercion: '+fasesInteraccionCreateInput.length);

    let respuesta;
    try{
        const values = [];

        fasesInteraccionCreateInput.forEach(faseInteraccionCreateInput => {
            const fase = {  
                fase_conversacion_id: faseInteraccionCreateInput.fase_conversacion_id,
                //fase_conversacion_id: -1,
                conversacion_id: faseInteraccionCreateInput.conversacion_id,
                //secuencia_en_conversacion: faseInteraccionCreateInput.secuencia_en_conversacion, //lo genera el trigger
                registro_esta_activo:true
            };
            values.push(fase);
        });

        const datosRetorno = 'id,fase_conversacion_id,conversacion_id,secuencia_en_conversacion,fecha_hora_mensaje_tarea_mostrado,registro_esta_activo';
        respuesta = await dbConnectionProvider.helpers.insert(values,columnasInsertFaseInteraccion)+' RETURNING '+datosRetorno;
    }
    catch(error){
        loggerGlobal.error('Error al estructurar query para insertar faseInteraccion ...');
        loggerGlobal.error(error);
        return error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Error al estructurar query para insertar faseInteraccion ...');
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorCapaDatos,
            'Error en la capa de datos al intentar estructurar query para insertar faseInteraccion ',respuesta);
    }

    return respuesta;
}


const actualizarCondicionEntradaEnFase_query = async (faseInteraccionId, condicionEntradaRecibidaId, fueEntradaParaAbortar) => {

    if (!faseInteraccionId || isNaN(faseInteraccionId)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar un fase interaccion id valido para actualizar la entrada en la fase');
    }

    if (!condicionEntradaRecibidaId || isNaN(condicionEntradaRecibidaId)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar un condicionEntradaRecibidaId valido para actualizar la fase de Interaccion');
    }

    if (fueEntradaParaAbortar === undefined){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar si fue entrada para abortar, para actualizar la fase de Interaccion');
    }

    const faseInteraccionIdBI = 0;
    loggerGlobal.debug('el faseInteraccionId que me llego para query de actualizar condicionEntrada es: '+faseInteraccionId);
    loggerGlobal.debug('el condicionEntradaRecibidaId que me llego para query de actualizar en faseInteraccion es: '+condicionEntradaRecibidaId);

    let respuesta;
    try{
        const values = [];

        const fase = {
            id: parseInt(faseInteraccionId), 
            registro_esta_activo: true,
            condicion_entrada_recibida_id: parseInt(condicionEntradaRecibidaId),
            fue_entrada_para_abortar: fueEntradaParaAbortar,
        };
        values.push(fase);

        const datosRetorno = 't.id,t.fase_conversacion_id,t.conversacion_id,t.secuencia_en_conversacion,t.fecha_hora_condicion_entrada_recibida';
        respuesta = await dbConnectionProvider.helpers.update(values,columnasUpdateCondicionEntradaEnFase)+ ' WHERE v.id = t.id  RETURNING '+datosRetorno;
        //respuesta = await dbConnectionProvider.helpers.update(values,columnasUpdateCondicionEntradaEnFase, null, {tableAlias: 'FI', valueAlias: 'V'})+ ' WHERE FI.id = V.id  RETURNING '+datosRetorno;
    }
    catch(error){
        loggerGlobal.error('Error al estructurar query para actualizarCondicionEntradaEnFase_query ...');
        loggerGlobal.error(error);
        return error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Error al estructurar query para actualizarCondicionEntradaEnFase_query ...');
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorCapaDatos,
            'Error en la capa de datos al intentar estructurar query para actualizarCondicionEntradaEnFase_query ',respuesta);
    }

    return respuesta;
}


const actualizarCondicionEntradaEnFase = async (faseInteraccionId, condicionEntradaRecibidaId, fueEntradaParaAbortar) => {

    let respuesta;
    try{

        const query = await actualizarCondicionEntradaEnFase_query(faseInteraccionId, condicionEntradaRecibidaId, fueEntradaParaAbortar);
        const respuesta = await dbConnectionProvider.one(query);

    }catch(error){
        loggerGlobal.error('Error en el metodo actualizarCondicionEntradaEnFase de faseInteraccion ...');
        loggerGlobal.error(error);
        return error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug(`No se pudo actualizar la condicion_entrada_id en fase_conversacion_id ${faseInteraccionId}`);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se pudo actualizar la condicion_entrada_id en fase_conversacion_id ${faseInteraccionId}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar actualizar la condicion_entrada_id en fase_conversacion_id ${faseInteraccionId}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo actualizarCondicionEntradaEnFase de faseInteraccion: ');
    loggerGlobal.debug(respuesta);
    return respuesta;

}


const FaseInteraccionDAO = {
    consultarUno : consultaUno,
    consultarTodos: consultaTodos,
    insertarUno: insertaUno,
    insertaFasesInteraccion_query:insertaFasesInteraccion_query,
    actualizarCondicionEntradaEnFase_query: actualizarCondicionEntradaEnFase_query,
    //actualizarCondicionEntradaEnFase: actualizarCondicionEntradaEnFase,
}

export {FaseInteraccionDAO};