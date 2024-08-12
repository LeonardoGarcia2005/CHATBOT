import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { FabricaErrores } from '../errors/errorsManager.js';
import { FaseInteraccionDAO } from '../dataAccessObjects/faseInteraccionDAO.js';
import { MensajeEmitidoDAO } from '../dataAccessObjects/mensajeEmitidoDAO.js';
import { configurationProvider } from '../../globalServices/config/configurationManager.js';
import { dbConnectionProvider } from '../db/dbConnectionManager.js';


const getMensajesEmitidosInput = (fases_interaccion_input, nombre_emisor, emisor_id, mensaje_no_de_fase) => {

    if (!fases_interaccion_input || !(fases_interaccion_input instanceof Array)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `Debe especificar un arreglo de FaseInteraccionCreateInput para poder crear los MensajeEmitidoCreateInput`);
    }

    //Si el emisor_id no se especifica, entonces no se evalua esta condicion. Es valido que sea null, cuando es la 
    //entrada de un cliente, el cual puede no estar registrado todavia como cliente en el sistema
    if (emisor_id && (isNaN(emisor_id) || emisor_id < 0)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `Debe especificar un emisor_id valido para poder llenar los MensajeEmitidoCreateInput`);
    }

    let mensajes_emitidos = [];
    fases_interaccion_input.forEach(faseInteraccionCreateInput => {
        const mensajeEmitidoCreateInput = {
            conversacion_id: faseInteraccionCreateInput.conversacion_id,
            fase_interaccion_id: faseInteraccionCreateInput.id,
            mensaje_emitido: (mensaje_no_de_fase ? mensaje_no_de_fase: faseInteraccionCreateInput.mensaje_fase_conversacion),
            nombre_emisor_del_mensaje: nombre_emisor,
            emisor_del_mensaje_id: emisor_id,
        }
        //faseInteraccionCreateInput.mensaje_emitido_input = mensajeEmitidoCreateInput;
        mensajes_emitidos.push(mensajeEmitidoCreateInput);
    });
    loggerGlobal.debug('los mensajes emitidos input son: ');
    loggerGlobal.debug(JSON.stringify(mensajes_emitidos));
    return mensajes_emitidos;
}

/** 
 * Este metodo esta concebido para invocarse cuando se deben registrar mensajes emitidos al producirse un error
 * durante el procesamiento de la condicion de entrada especificada por el cliente. Aqui se llenaran 2 objetos
 * FaseInteraccionCreateInput, que corresponden a la entrada especificada por el cliente y el mensaje del sistema, que 
 * es el mensaje de error de la faseConversacion actual. Ambos objetos llevaran el mismo faseInteraccionId generado con
 * la última faseConversacion ejecutada antes de producirse el error.
*/
const registrarMensajesEmitidos = async (conversacionId, faseInteraccionId, userNameCliente, clienteId, entrada_de_cliente, mensaje_del_sistema) => {

    if (!conversacionId || isNaN(conversacionId)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el id de la conversacion para poder registrar los mensajes emitidos despues del error que se produjo');
    }

    if (!faseInteraccionId || isNaN(faseInteraccionId)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el id de la faseInteraccion para poder registrar los mensajes emitidos despues del error que se produjo');
    }

    //Si el cliente_id no se especifica, entonces no se evalua esta condicion. Es valido que sea null, ya que
    //el cliente puede no estar registrado todavia como cliente en el sistema
    if (clienteId && (isNaN(clienteId) || clienteId < 0)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            `Debe especificar un emisor_id valido para poder llenar los MensajeEmitidoCreateInput`);
    }

    if (!entrada_de_cliente || entrada_de_cliente.trim().length == 0){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar la entrada del cliente para poder registrar los mensajes emitidos despues del error que se produjo');
    }

    if (!mensaje_del_sistema || mensaje_del_sistema.trim().length == 0){
        /*throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el mensaje de error del sistema para poder registrar los mensajes emitidos despues del error que se produjo');*/
            mensaje_del_sistema = 'Mensaje del sistema no especificado';
    }

    const faseInteraccionCreateInput = [
        {
            conversacion_id: conversacionId,
            id : faseInteraccionId,
        },
    ];

    try{

        const mensajesEmitidosInput = MensajeEmitido.getMensajesEmitidosInput(
            faseInteraccionCreateInput, userNameCliente, clienteId, entrada_de_cliente);

        const mensajesEmitidosInputSistema = MensajeEmitido.getMensajesEmitidosInput(
            faseInteraccionCreateInput, configurationProvider.system.userName, configurationProvider.system.userId, mensaje_del_sistema);

        mensajesEmitidosInputSistema.forEach(mensajeSistema => {
            mensajesEmitidosInput.push(mensajeSistema);
        });

        const queryMensajes = await MensajeEmitidoDAO.insertaMensajesEmitidos_query(mensajesEmitidosInput);

        const mensajesEmitidosIncluidos = await dbConnectionProvider.many(queryMensajes);

        return mensajesEmitidosIncluidos;

    }
    catch(error){
        loggerGlobal.error('Error al intentar registrar los mensajes emitidos bajo condición de error, en conversacionId: '+conversacionId);
        loggerGlobal.error(error.message);
    }
    
    return null;
}



const MensajeEmitido = {
    getMensajesEmitidosInput: getMensajesEmitidosInput,
    registrarMensajesEmitidos: registrarMensajesEmitidos,
}

export {MensajeEmitido};