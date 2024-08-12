import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import { FabricaErrores } from '../errors/errorsManager.js';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';


let columnasInsertMensajeEmitido;
let columnaFechaHoraRegistro;

if (!columnasInsertMensajeEmitido){
    //Se crean aqui, estaticamente, para crearlas solo 1 vez y mejorar performance 
    loggerGlobal.debug('voy a crear el ColumnSet en mensajeEmitidoDAO...');

    const Column = dbConnectionProvider.helpers.Column;
    columnaFechaHoraRegistro = new Column({
        name:'fecha_hora_registro',
        mod:'^',
        def:'current_timestamp'
    });

    columnasInsertMensajeEmitido = new dbConnectionProvider.helpers.ColumnSet(
        ['conversacion_id',
        'mensaje_emitido',
        'nombre_emisor_del_mensaje',
        'emisor_del_mensaje_id',
        'fase_interaccion_id',
        columnaFechaHoraRegistro,
        'registro_esta_activo',
        ],
        {table:'mensaje_conversacion_emitido'});
}

const insertaMensajesEmitidos_query = async (mensajesEmitidosCreateInput) => {

    if (!mensajesEmitidosCreateInput || mensajesEmitidosCreateInput.length < 1){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar al menos 1 mensaje emitido para insertar');
    }

    const conversacionId = mensajesEmitidosCreateInput[0].conversacion_id;
    loggerGlobal.debug('el conversacionId que me llego para query de insercion mensajeEmitido es: '+conversacionId);
    loggerGlobal.debug('cantidad de mensajes para insercion: '+mensajesEmitidosCreateInput.length);

    //loggerGlobal.debug('los datos que me llegaron para query de insercion mensajeEmitido es: ');
    //loggerGlobal.debug(JSON.stringify(mensajeEmitidoCreateInput));
    let respuesta;

    //try{
        const values = [];
        mensajesEmitidosCreateInput.forEach(mensajeEmitidoCreateInput => {

            if (!mensajeEmitidoCreateInput.conversacion_id || mensajeEmitidoCreateInput.conversacion_id < 1){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorValidacionDatos,
                    'Debe especificar un conversacion_id valido para insertar el mensaje emitido');
            }
        
            if (mensajeEmitidoCreateInput.emisor_del_mensaje_id && (isNaN(mensajeEmitidoCreateInput.emisor_del_mensaje_id) || mensajeEmitidoCreateInput.emisor_del_mensaje_id < 0)){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorValidacionDatos,
                    'Debe especificar un emisor_del_mensaje_id valido para insertar el mensaje emitido');
            }
        
            if (!mensajeEmitidoCreateInput.fase_interaccion_id || mensajeEmitidoCreateInput.fase_interaccion_id < 1){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorValidacionDatos,
                    'Debe especificar un fase_interaccion_id valido para insertar el mensaje emitido');
            }
        
            const mensaje = {  
                conversacion_id: mensajeEmitidoCreateInput.conversacion_id,
                mensaje_emitido: mensajeEmitidoCreateInput.mensaje_emitido,
                nombre_emisor_del_mensaje: mensajeEmitidoCreateInput.nombre_emisor_del_mensaje,
                emisor_del_mensaje_id: mensajeEmitidoCreateInput.emisor_del_mensaje_id,
                fase_interaccion_id: mensajeEmitidoCreateInput.fase_interaccion_id,
                registro_esta_activo:true
            }
            values.push(mensaje);
        });

        const datosRetorno = 'id,mensaje_emitido';
        respuesta = await dbConnectionProvider.helpers.insert(values,columnasInsertMensajeEmitido)+' RETURNING '+datosRetorno;
    /*}
    catch(error){
        loggerGlobal.error('Error al estructurar query para insertar mensajeEmitido ...');
        loggerGlobal.error(error);
        return error;
    }*/

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('Error al estructurar query para insertar mensajeEmitido ...');
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorCapaDatos,
            'Error en la capa de datos al intentar estructurar query para insertar mensajeEmitido ',respuesta);
    }

    return respuesta;
}

const MensajeEmitidoDAO = {
    insertaMensajesEmitidos_query:insertaMensajesEmitidos_query,
}

export {MensajeEmitidoDAO};