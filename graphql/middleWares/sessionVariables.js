import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import {configurationProvider} from '../../globalServices/config/configurationManager.js';
import { FabricaErrores } from '../../models/errors/errorsManager.js';

//let variablesMap;
const ChatgeaVariable = {

    $FASE_CONVERSACION_ID_ACTUAL : 'FASE_CONVERSACION_ID_ACTUAL',
    $IDENTIFICACION_CLIENTE : 'IDENTIFICACION_CLIENTE',
}

const ChatgeaConstants = {

    $ESTADO_AUTENTICACION_EN_PROCESO : 1000,
    $ESTADO_AUTENTICACION_NO_AUTENTICADO : 2000,
    $ESTADO_AUTENTICACION_AUTENTICADO : 3000,
}


class SessionVariables{
    sessionId;
    //faseConversacionActual;
    variablesMap;
    //guionConversacion;
    conversacion;
    ultimaFaseinteraccionId;
    faseConversacionIdNodoBase;
    condicionEntradaParaAbortar;
    tokenJWT;
    esAccesoPublico = false;
    estadoAutenticacionUsuario = ChatgeaConstants.$ESTADO_AUTENTICACION_NO_AUTENTICADO;
    userNameCliente;
    clienteId;
    usuarioCliente;
    entradaClienteAntesDeAutenticarse;
    tengoUserNameAutenticado = false;
    tengoPasswordAutenticado = false;
    
    constructor(sessionId){
        if (!sessionId){
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorValidacionDatos,
                'Debe especificar el sessionId para crear las variables de la sesion');
        }

        this.sessionId = sessionId;
        loggerGlobal.debug('Creando el SessionVariable con sessionId: '+sessionId);
        
        this.sessionUniqueId = sessionId;
        this.variablesMap = new Map();/*[
            [ChatgeaVariable.$FASE_CONVERSACION_ID_ACTUAL,0],
            [ChatgeaVariable.$IDENTIFICACION_CLIENTE,'']]);*/
            this.variablesMap.set(ChatgeaVariable.$FASE_CONVERSACION_ID_ACTUAL,0);
            this.variablesMap.set(ChatgeaVariable.$IDENTIFICACION_CLIENTE,'');

        loggerGlobal.debug('el variables Map es: '+this.variablesMap.entries());
        loggerGlobal.debug(JSON.stringify(this.variablesMap));
    }

    setVariable(variable){
        this.variablesMap.set(variable,null);
    }

    getValorDeVariable(variable){
        return this.variablesMap.get(variable);
    }

    setFaseConversacionActual(fase){
        this.faseConversacionActual = fase;
    }

    setConversacionIdActual(conversacionId){
        this.conversacionIdActual = conversacionId;
    }

    getFaseConversacionIdActual(){
        if (this.faseConversacionActual) return this.faseConversacionActual;

        return 0;
    }

    /*setValorDeVariable(variable,valor){
        this.variablesMap.set(variable,valor);
    }*/

    setValorDeVariables(variable,valor){
        this.variablesMap.set(variable,valor);
    }

}

/*const receiveSession = async(session) => {
    if (!webSession){
        webSession = session;
    }
}*/

export {ChatgeaVariable}
export {ChatgeaConstants}
export {SessionVariables}