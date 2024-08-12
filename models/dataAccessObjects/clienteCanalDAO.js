import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';

let columnasInsertClienteCanal;

if (!columnasInsertClienteCanal){
    //Se crean aqui, estaticamente, para crearlas solo 1 vez y mejorar performance 
    loggerGlobal.debug('voy a crear el ColumnSet en ClienteCanalDAO...');

    const Column = dbConnectionProvider.helpers.Column;
    const columnaFechaHoraRegistroCliente = new Column({
        name:'fecha_hora_registro_cliente',
        mod:'^',
        def:'current_timestamp'
    });

    const columnaFechaHoraPrimeraConversacion = new Column({
        name:'fecha_hora_primera_conversacion',
        mod:'^',
        def:'current_timestamp'
    });

    columnasInsertClienteCanal = new dbConnectionProvider.helpers.ColumnSet(
        ['canal_id',
        'identificador_cliente_en_canal',
        columnaFechaHoraRegistroCliente,
        columnaFechaHoraPrimeraConversacion,
        'registro_esta_activo',
        ],
        {table:'cliente_canal'});
}

const consultarClienteCanalPorIdentificador_query = async (identificadorClienteEnCanal,canalId) => {
    loggerGlobal.info('el identificadorClienteEnCanal que me llego para consultar el clienteCanal es: '+identificadorClienteEnCanal);
    if (!identificadorClienteEnCanal || identificadorClienteEnCanal.trim().length < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el identificador del cliente en el canal para esta consulta');
    }

    loggerGlobal.info('el canal_id que me llego para consultar el clienteCanal es: '+canalId);
    if (!canalId || isNaN(canalId) || canalId < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el canal_id y que sea mayor que cero para consultar el clienteCanal');
    }

    //const values = [guionConversacionId];
    const query =  `SELECT  cc.id,cc.cliente_chatbot_id,cc.canal_id,cc.identificador_cliente_en_canal,cc.fecha_hora_registro_cliente,
                            cc.fecha_hora_baja_cliente_canal,cc.fecha_hora_primera_conversacion,cc.registro_esta_activo
                    FROM	cliente_canal cc
                    INNER JOIN canal ca
                    ON		cc.canal_id = ca.id
                    WHERE	cc.canal_id = ${canalId}
                    AND		cc.identificador_cliente_en_canal = '${identificadorClienteEnCanal}'`;
    
    //loggerGlobal.debug('el query para consultar el clienteCanal es: ');
    //loggerGlobal.debug(query);

    return query;
}


const consultarClienteCanal_query = async (cliente_canal_id) => {
    loggerGlobal.info('el cliente_canal_id que me llego para consultar es: '+cliente_canal_id);
    if (!cliente_canal_id || isNaN(cliente_canal_id) || cliente_canal_id < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el cliente_canal_id para esta consulta');
    }

    //const values = [guionConversacionId];
    const query =  `SELECT  cc.id,cc.cliente_chatbot_id,cc.canal_id,cc.identificador_cliente_en_canal,cc.fecha_hora_registro_cliente,
                            cc.fecha_hora_baja_cliente_canal,cc.fecha_hora_primera_conversacion,cc.registro_esta_activo
                    FROM	cliente_canal cc
                    WHERE	cc.id = ${cliente_canal_id}`;
    
    //loggerGlobal.debug('el query para consultar el clienteCanal es: ');
    //loggerGlobal.debug(query);

    return query;
}


const consultarClienteCanalPorIdentificador = async (identificadorClienteEnCanal,canalId) => {

    let respuesta;
    try
    {
        const query = await consultarClienteCanalPorIdentificador_query(identificadorClienteEnCanal,canalId);
        respuesta = await dbConnectionProvider.oneOrNone(query);
    }
    catch(errorConsulta){
        loggerGlobal.error(`Error al consultar el clienteCanal por canal y el identificador ${identificadorClienteEnCanal}`);
        loggerGlobal.error(error);
        return error;
        /*if (errorConsulta instanceof dbConnectionProvider.pgpErrors.QueryResultError)
        {
            if (errorConsulta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro el clienteCanal para el identificador de cliente ${identificadorClienteEnCanal}
                     y el canal_id ${canalId}`,
                    errorConsulta);
            }
        }
        throw errorConsulta;*/
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug('Obtuve un error al intentar consultar el clienteCanal por canal y el identificador '+identificadorClienteEnCanal);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontrao el clienteCanal ${cliente_canal_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar el clienteCanal por canal y el identificador ${identificadorClienteEnCanal}`,respuesta);
        }
    }

    loggerGlobal.debug('Respuesta en el metodo consultarClienteCanalPorIdentificador de clienteCanalDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}


const consultarClienteCanal = async (cliente_canal_id) => {

    let respuesta;

    try
    {
        const query = await consultarClienteCanal_query(cliente_canal_id);
        respuesta = await dbConnectionProvider.one(query);

    }
    catch(error){
        loggerGlobal.error(`Error al consultar el clienteCanal para el id ${cliente_canal_id}`);
        loggerGlobal.error(error);
        respuesta = error;
        //return error;
        /*if (errorConsulta instanceof dbConnectionProvider.pgpErrors.QueryResultError)
        {
            if (errorConsulta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontro el clienteCanal para el id ${cliente_canal_id}`,
                    errorConsulta);
            }
        }
        throw errorConsulta;*/
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.debug('Obtuve un error al intentar consultar el clienteCanal para el id '+cliente_canal_id);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorDatosNoEncontrados,
                    `No se encontrao el clienteCanal ${cliente_canal_id}`,respuesta);
        }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar consultar el clienteCanal ${cliente_canal_id}`,respuesta);
        }
    }
    
    loggerGlobal.debug('Respuesta en el metodo consultarClienteCanalPorId de clienteCanalDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}


const insertaClienteCanal_query = async (clienteCanalCreateInput) => {

    if (!clienteCanalCreateInput){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar los datos para insertar el cliente');
    }

    loggerGlobal.debug('el identificador de cliente que me llego para la insercion de clienteCanal: '+clienteCanalCreateInput.identificador_cliente_en_canal);
    /*if (!clienteCanalCreateInput.identificador_cliente_en_canal || 
        clienteCanalCreateInput.identificador_cliente_en_canal.trim().length < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el identificador del cliente en el canal para la insercion');
    }*/

    loggerGlobal.debug('el canal_id que me llego para la insercion de clienteCanal: '+clienteCanalCreateInput.canal_id);
    if (!clienteCanalCreateInput.canal_id || 
        isNaN(clienteCanalCreateInput.canal_id) ||
        clienteCanalCreateInput.canal_id < 1){
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorValidacionDatos,
                'Debe especificar un canalId valido para la insercion');
    }

    try{
        const values = [{canal_id:clienteCanalCreateInput.canal_id,
                        identificador_cliente_en_canal:clienteCanalCreateInput.identificador_cliente_en_canal,
                        registro_esta_activo:true,
        }];

        const datosRetorno = 'id,cliente_chatbot_id,canal_id,identificador_cliente_en_canal,fecha_hora_registro_cliente,fecha_hora_primera_conversacion,registro_esta_activo';
        const query = await dbConnectionProvider.helpers.insert(values,columnasInsertClienteCanal)+' RETURNING '+datosRetorno;
        return query;

    }catch(error){
        loggerGlobal.error('Error al estructurar query para insertar clienteChatbot ...');
        loggerGlobal.error(error);
        return error;
    }
}


const insertaClienteCanal = async (clienteCanalCreateInput) => {
    let respuesta;

    try{
        const query = await insertaClienteCanal_query(clienteCanalCreateInput);
        loggerGlobal.debug('El query para insertar el clienteCanal es: ');
        loggerGlobal.debug(query);

        respuesta = await dbConnectionProvider.one(query);

    }catch(error){
        loggerGlobal.error('Error al tratar de insertar el clienteCanal ...');
        loggerGlobal.error(error);
        return error;
    }
    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Obtuve un error al intentar insertar un clienteCanal ...');
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar insertar el clienteCanal con canal_id ${clienteCanalCreateInput.canal_id}`,respuesta);
    }

    //const respuesta = await connectDB.one(`select id,nombreguion,TO_CHAR(fechahoraregistro,'YYYY/MM/DD HH:MI:SS') as fechahoraregistro,TO_CHAR(fechahoraactualizacion,'YYYY/MM/DD HH:MI:SS') as fechahoraactualizacion from GUION_CONVERSACION where id=$1`,values);
    loggerGlobal.debug('Respuesta en el metodo insertaClienteCanal de clienteCanalDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const ClienteCanalDAO = {
    consultarClienteCanal: consultarClienteCanal,
    consultarClienteCanalPorIdentificador: consultarClienteCanalPorIdentificador,
    insertaClienteCanal_query:insertaClienteCanal_query,
    insertaClienteCanal:insertaClienteCanal,
}

export {ClienteCanalDAO};