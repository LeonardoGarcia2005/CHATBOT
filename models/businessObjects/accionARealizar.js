import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { AccionARealizarDAO } from '../dataAccessObjects/accionARealizarDAO.js';
import { TIPO_ACCION } from './modelConstants.js';

async function ejecutarAccion(accionARealizar){

    if (!accionARealizar) return false;

    if (accionARealizar.tipo_accion_id == TIPO_ACCION.INVOCAR_SERVICIO_API){

        loggerGlobal.debug(`TEMPORAL: Se invoco correctamente el servicio para la accion: ${accionARealizar.nombre_accion_realizar}`);
        return false;
    }

    if (accionARealizar.tipo_accion_id == TIPO_ACCION.ENVIAR_CORREO_ELECTRONICO){
        loggerGlobal.debug(`TEMPORAL: Se envio correctamente el correo para la accion: ${accionARealizar.nombre_accion_realizar}`);
        return true;
    }

    return false;
}

const ejecutarAccionesDeEntrada = async (condicion_entrada_id) => {

    loggerGlobal.debug('la condicion_entrada_id que me llego: '+condicion_entrada_id);

    if (!condicion_entrada_id || isNaN(condicion_entrada_id)){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe proveer un condicion_entrada_id valido para consultar las acciones a realizar');
    }
    
    const accionesARealizar = await AccionARealizarDAO.consultarAccionesARealizarPorEntrada(condicion_entrada_id);

    let accionesEjecutadas = true;
    accionesARealizar.forEach(async accion => {
        loggerGlobal.debug('Evaluando la accion a realizar: '+accion.nombre_accion_realizar);
        const accionEjecutada = await ejecutarAccion(accion);

        if (!accionEjecutada || accionEjecutada === false){ 
            loggerGlobal.debug('La accion no se ejecuto ');

            if (accion.requiere_ejecucion_exitosa === true){
                accionesEjecutadas = false;
                loggerGlobal.debug('La accion requiere ejecución exitosa; ');
            }
            //Si la accion no requiere ejecucion exitosa entonces da igual que no se haya ejecutado
            //y por eso no se cambia la bandera accionesEjecutadas
        }
        
    });

    if (!accionesARealizar || accionesARealizar.length === 0){
        loggerGlobal.debug('No hubo acciones a realizar, se retornara true ');
    }

    return accionesEjecutadas;
}

const AccionARealizar = {
    ejecutarAccionesDeEntrada: ejecutarAccionesDeEntrada
}

export {AccionARealizar};