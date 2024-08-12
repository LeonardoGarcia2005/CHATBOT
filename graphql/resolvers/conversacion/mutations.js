import { loggerGlobal } from '../../../globalServices/logging/loggerManager.js';
import { createAccessToken } from '../../../globalServices/security/jwtManager.js';
import {ChatgeaConstants } from '../../middleWares/sessionVariables.js'
import { FabricaErrores,ErrorUsuarioRequiereAutenticacion } from '../../../models/errors/errorsManager.js';
import { comparePassword } from '../../../globalServices/security/bcrypt.js';
import {Conversacion} from '../../../models/businessObjects/conversacion.js'
import {CondicionEntrada} from '../../../models/businessObjects/condicionEntrada.js'
import { MensajeEmitido } from '../../../models/businessObjects/mensajeEmitido.js';
import { AccionARealizar } from '../../../models/businessObjects/accionARealizar.js';
import { Usuario,nombreUsuarioEsValido,claveUsuarioEsValida } from '../../../models/businessObjects/usuario.js';


const invocarRegistroMensajesEmitidos = async (sessionVariables, entrada_de_cliente, mensajeDelSistema) => {
    
    loggerGlobal.debug('Voy a invocar el servicio para el registro de mensajes emitidos ...');

    try{
        const mensajesEmitidos = MensajeEmitido.registrarMensajesEmitidos(sessionVariables.conversacion.id,
            sessionVariables.ultimaFaseinteraccionId,
            sessionVariables.userNameCliente,
            sessionVariables.clienteId,
            entrada_de_cliente,
            mensajeDelSistema
        )
        return mensajesEmitidos;
    }
    catch(error){
        loggerGlobal.error('Hubo un error al invocar el servicio para el registro de mensajes emitidos: '+error.message);
    }
    return null;

}


const siguienteFaseConversacion = async (sessionVariables, entrada_de_cliente, invocadaUsuarioAutenticado) => {

    const usuarioEstaAutenticado = sessionVariables.estadoAutenticacionUsuario === ChatgeaConstants.$ESTADO_AUTENTICACION_AUTENTICADO;

    const conversacionActualizada =  await Conversacion.continuarConversacion(
                                                sessionVariables.userNameCliente,
                                                sessionVariables.clienteId,
                                                entrada_de_cliente, 
                                                sessionVariables.conversacion.id, 
                                                sessionVariables.condicionEntradaParaAbortar,
                                                sessionVariables.faseConversacionIdNodoBase,
                                                sessionVariables.conversacion.ultima_fase_conversacion.id,
                                                sessionVariables.conversacion.ultima_fase_conversacion.mensaje_entrada_invalida,
                                                sessionVariables.ultimaFaseinteraccionId,
                                                usuarioEstaAutenticado);

    if (conversacionActualizada){ 
      loggerGlobal.debug('recibi una respuesta en continuarConversacion ...');
      
      const faseInteraccion = conversacionActualizada.fases_interaccion[conversacionActualizada.fases_interaccion.length - 1];
      if (faseInteraccion){
          const faseConversacionId = faseInteraccion.fase_conversacion_id;
          loggerGlobal.debug('la faseConversacionId actual se fijara en: '+faseConversacionId);

          sessionVariables.ultimaFaseinteraccionId = faseInteraccion.id;
          loggerGlobal.debug('la ultimaFaseinteraccionId se fijara en: '+faseInteraccion.id);
        
          loggerGlobal.debug('el objeto conversacion se guardara en la sesion: '+conversacionActualizada);

          //blanqueamos el arreglo de fases_interaccion para que no ocupen memoria en la sesión del servidor
          conversacionActualizada.fases_interaccion = [];
          sessionVariables.conversacion = conversacionActualizada;

          //loggerGlobal.debug('Objeto que quedó en la memoria: '+JSON.stringify(sessionVariables));
      }
    }

    //newToken debe enviarse en NULL si no se está invocando desde la conversacionParaAutenticacion
    if (invocadaUsuarioAutenticado){ //&& invocadaUsuarioAutenticado === true){
        
        loggerGlobal.debug('Voy a modificar mensaje de fase para informar autenticacion exitosa del usuario ..');
        conversacionActualizada.tokenJWTUsuarioAutenticado = sessionVariables.tokenJWT;
        const mensajeModificado = 'El usuario fue autenticado; se muestra respuesta a opción escogida por usted:\n\n' +
                                    conversacionActualizada.ultima_fase_conversacion.mensaje_de_fase;
        conversacionActualizada.ultima_fase_conversacion.mensaje_de_fase = mensajeModificado;

    }
    else conversacionActualizada.tokenJWTUsuarioAutenticado = null;
    
    return conversacionActualizada;
}


const conversacionParaAutenticacion = async (sessionVariables, entrada_de_cliente) => {

    const condicionEntradaParaAbortar = sessionVariables.condicionEntradaParaAbortar;

    if (condicionEntradaParaAbortar.valor_dato_constante && 
        condicionEntradaParaAbortar.valor_dato_constante.toString() === entrada_de_cliente.trim().toString()){
    
            loggerGlobal.debug('El cliente introdujo la condicion de entrada para abortar ... ');
            //const mensajesEmitidos = invocarRegistroMensajesEmitidos(sessionVariables, entrada_de_cliente, 
                                                                    //'Cliente introdujo la condición para abortar');

            sessionVariables.estadoAutenticacionUsuario = ChatgeaConstants.$ESTADO_AUTENTICACION_NO_AUTENTICADO;
            const conversacionContinuada = siguienteFaseConversacion(sessionVariables,entrada_de_cliente,false);
            return conversacionContinuada;
    }


    if (!sessionVariables.tengoUserNameAutenticado){

        let mensajeParaCliente = '';
        if (nombreUsuarioEsValido(entrada_de_cliente)){

            const usuario = await Usuario.consultarUsuarioPorNombre(entrada_de_cliente);
            if (usuario){
                loggerGlobal.debug('Usuario obtenido es: '+JSON.stringify(usuario));
                mensajeParaCliente = 'Ahora introduzca su clave por favor';
                sessionVariables.tengoUserNameAutenticado = true;
                sessionVariables.usuarioCliente = usuario;
            }
            else{
                mensajeParaCliente = 'El nombre de usuario especificado no está registrado; introduzca nuevamente su nombre de usuario';
            }
        }
        else{
            mensajeParaCliente = 'El nombre de usuario debe contener solo letras y/o numeros, y tener una longitud entre 10 y 30 caracteres';
        }

        const mensajesEmitidos = invocarRegistroMensajesEmitidos(sessionVariables, entrada_de_cliente, 
                                                                mensajeParaCliente);

        const conversacionParaAutenticacion = {
          id: sessionVariables.conversacion.id,
          ultima_fase_conversacion: {
              mensaje_de_fase: mensajeParaCliente,
          },
          tokenJWTUsuarioAutenticado: null,
        }

        return conversacionParaAutenticacion;
      }
      
      if (!sessionVariables.tengoPasswordAutenticado){
          
          let mensajeParaCliente = '';
          let newToken;
          if (claveUsuarioEsValida(entrada_de_cliente)){

              const usuario = sessionVariables.usuarioCliente;
              if (await comparePassword(entrada_de_cliente,
                                        usuario.clave_usuario)){

                  console.log('Se autentico el usuario; solicitando un nuevo token ...');
                  newToken = await createAccessToken(false, usuario);
          
                  loggerGlobal.debug('El nuevo token generado es: '+newToken);
                  loggerGlobal.debug('Meti el token autenticado en el sessionVariables .. ');
                  
                  sessionVariables.tokenJWT = newToken;
                  sessionVariables.esAccesoPublico = false;
                  sessionVariables.userNameCliente = usuario.nombre_usuario;
                  sessionVariables.clienteId = usuario.clienteId;
                  sessionVariables.tengoPasswordAutenticado = true;
                  sessionVariables.estadoAutenticacionUsuario = ChatgeaConstants.$ESTADO_AUTENTICACION_AUTENTICADO;

                  loggerGlobal.debug('Voy a continuar la conversacion en la fase elegida por el cliente antes de solicitar autenticación ...');
                  const conversacionContinuada = siguienteFaseConversacion(sessionVariables,
                                                                            sessionVariables.entradaClienteAntesDeAutenticarse,
                                                                            true);
                  return conversacionContinuada;

              }
              else{
                  mensajeParaCliente = 'La clave especificada es incorrecta';
              }
          }
          else{
              mensajeParaCliente = 'La clave de usuario debe tener una longitud entre 6 y 30 caracteres';
          }

          const mensajesEmitidos = invocarRegistroMensajesEmitidos(sessionVariables, entrada_de_cliente, 
                                                                    mensajeParaCliente);

          const conversacionParaAutenticacion = {
              id: sessionVariables.conversacion.id,
              ultima_fase_conversacion: {
                  mensaje_de_fase: mensajeParaCliente
              },
              tokenJWTUsuarioAutenticado: newToken,
          }
          loggerGlobal.debug('Voy a retornar esta conversacion como: '+JSON.stringify(conversacionParaAutenticacion));
          return conversacionParaAutenticacion;
      }
}

const conversacionMutations = {
  crearConversacion: async (_, {conversacionCreateInput,guionConversacionId}) => {
    loggerGlobal.debug('entrando a la mutacion en crearConversacion ...')
    return await Conversacion.insertarUno(conversacionCreateInput,guionConversacionId);
  },
  
  crearConversacionCompleta: async (_, {conversacionCreateInput,faseInteraccionCreateInput,guionConversacionId}) => {
    loggerGlobal.debug('entrando a la mutacion en crearConversacion tx ...')
    const respuesta = await Conversacion.txInsertarConversacion(conversacionCreateInput,faseInteraccionCreateInput,guionConversacionId);
    if (respuesta) loggerGlobal.debug('recibi una respuesta en crearConersacionTx ...');
    return respuesta;
  },
  
  crearNuevaConversacion: async (_, {conversacionCreateInput, identificadorCliente},contextValue) => {
    
    let sessionVariables = contextValue.session.sessionVariables;
    if (sessionVariables.conversacionIdActual && sessionVariables.conversacionIdActual > 0){
      throw FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorValidacionDatos,
        'Esta sesion de cliente ya inicio una conversacion, y no se puede iniciar otra hasta terminar la anterior');
    }

    loggerGlobal.debug('entrando a la mutacion en crearNuevaConversacion ...')
    const conversacion = await Conversacion.crearNuevaConversacion(conversacionCreateInput, identificadorCliente);
    
    if (conversacion){ 
        loggerGlobal.debug('recibi una respuesta en crearNuevaConversacion ...');
        
        const faseInteraccion = conversacion.fases_interaccion[conversacion.fases_interaccion.length - 1];
        if (faseInteraccion){
            const faseConversacionId = faseInteraccion.fase_conversacion_id;
            loggerGlobal.debug('la faseConversacionId actual se fijara en: '+faseConversacionId);

            sessionVariables.ultimaFaseinteraccionId = faseInteraccion.id;
            loggerGlobal.debug('la ultimaFaseinteraccionId se fijara en: '+faseInteraccion.id);
          
            //sessionVariables.faseConversacionActual = conversacion.ultima_fase_conversacion;
            //loggerGlobal.debug('actualice la fase conversacion actual en SessionVariables ');

            sessionVariables.condicionEntradaParaAbortar = conversacion.guion_conversacion.condicion_entrada_para_abortar;
            loggerGlobal.debug('la condicion para abortar que esta en el guion es: '+sessionVariables.condicionEntradaParaAbortar.valor_dato_constante);

            //blanqueando propiedades del objeto conversacion para no ocupar memoria en el servidor
            conversacion.fases_interaccion = []; 
            conversacion.guion_conversacion = null;
            sessionVariables.conversacion = conversacion;
            loggerGlobal.debug('el objeto conversacion se guardo en la sesion: '+conversacion);

            //sessionVariables.guionConversacion = conversacion.guion_conversacion;
            //loggerGlobal.debug('almacene el guionConversacion en SessionVariables ');

            sessionVariables.faseConversacionIdNodoBase = conversacion.fase_conversacion_nodo_base.id;
            loggerGlobal.debug('el id de la faseConversacion base es: '+sessionVariables.faseConversacionIdNodoBase);

        }
    }
    return conversacion;
  },

  
  continuarConversacion: async (_, {conversacionUpdateInput},contextValue) => {

    let sessionVariables = contextValue.session.sessionVariables;
    if (!sessionVariables.conversacion || !sessionVariables.conversacion.id || isNaN(sessionVariables.conversacion.id)){
      throw FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorValidacionDatos,
        'En esta sesion de cliente no se ha iniciado una conversacion todavia');
    }

    loggerGlobal.debug('conversacionUpdateInput.entrada_de_cliente que me llego: '+conversacionUpdateInput.entrada_de_cliente);

    try{
        if (sessionVariables.estadoAutenticacionUsuario !== ChatgeaConstants.$ESTADO_AUTENTICACION_EN_PROCESO){
        
            const conversacionSiguiente = await siguienteFaseConversacion(sessionVariables,
                                                                            conversacionUpdateInput.entrada_de_cliente,
                                                                            false);
            return conversacionSiguiente;
        }
        else{

            loggerGlobal.debug('estoy en el proceso de Autenticacion del usuario ... ');

            const conversacionAutenticarCliente = await conversacionParaAutenticacion(sessionVariables,conversacionUpdateInput.entrada_de_cliente);
            return conversacionAutenticarCliente;
        }
    }
    catch(error){
        loggerGlobal.error('Error al invocar el servicio continuarConversacion: '+error.message);

        let mensajeErrorSistema = '';
        if (error instanceof ErrorUsuarioRequiereAutenticacion) mensajeErrorSistema = 'La opción escogida requiere autenticacion del usuario.';
        else mensajeErrorSistema = error.message;

        const mensajesEmitidos = MensajeEmitido.registrarMensajesEmitidos(sessionVariables.conversacion.id,
                                                                            sessionVariables.ultimaFaseinteraccionId,
                                                                            sessionVariables.userNameCliente,
                                                                            sessionVariables.clienteId,
                                                                            conversacionUpdateInput.entrada_de_cliente,
                                                                            mensajeErrorSistema
        )

        if (error instanceof ErrorUsuarioRequiereAutenticacion){
            loggerGlobal.info('La fase de Conversacion requiere autenticacion; comienzo el ESTADO_AUTENTICACION_EN_PROCESO ...');
            sessionVariables.estadoAutenticacionUsuario = ChatgeaConstants.$ESTADO_AUTENTICACION_EN_PROCESO;
            sessionVariables.entradaClienteAntesDeAutenticarse = conversacionUpdateInput.entrada_de_cliente;

            const conversacionParaAutenticacion = {
                id: sessionVariables.conversacion.id,
                ultima_fase_conversacion: {
                    mensaje_de_fase: 'El próximo paso de la conversación escogido por usted requiere autenticación; Por favor introduzca su nombre de usuario:',
                },
                tokenJWTUsuarioAutenticado: null,
            }

            return conversacionParaAutenticacion;
        }
        else throw error; //relanzo el error si no es ErrorUsuarioRequiereAutenticacion
    }
  },

};
  
export {conversacionMutations};