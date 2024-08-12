import fetch from 'node-fetch';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { FabricaErrores } from '../errors/errorsManager.js';
import { InvocadorServicioAPIDAO } from '../dataAccessObjects/invocadorServicioAPIDAO.js';
import { configurationProvider } from '../../globalServices/config/configurationManager.js';

const invocar = async(servicioId, valoresentrada) => {

    /*loggerGlobal.debug('Buscando el servicio a invocar con id: '+servicioId);
    const invocadorServicio = await InvocadorServicioAPIDAO.consultarInvocadorServicioAPIPorId(servicioId);

    loggerGlobal.debug('el servicio que encontre es: ');
    loggerGlobal.debug(JSON.stringify(invocadorServicio));

    let params;

    if (invocadorServicio.parametrosEntrada && invocadorServicio.parametrosEntrada.length > 0){
        
        if (!valoresentrada || !isArray(valoresentrada) || valoresentrada.length < 1){
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorValidacionDatos,
                'Debe especificar valores para los parametros de entrada del servicio a invocar');
        }
    
        params = new URLSearchParams();
        invocadorServicio.parametrosEntrada.forEach(parametro => {
            params.append(parametro.nombre_parametro_entrada,0);
        });
    }

    let serviceUser;
    let servicePassword;
    if (invocadorServicio.credenciales_en_BD && invocadorServicio.credenciales_en_BD === true){
        loggerGlobal.debug('Las credenciales para el servicio se tomarán de la BD ... ');
        serviceUser = invocadorServicio.usuario_acceso_api;
        servicePassword = invocadorServicio.clave_acceso_api;
    }
    else{
        loggerGlobal.debug('Las credenciales para el servicio se tomarán de la configuración en archivos ... ');
        serviceUser = configurationProvider.apiServices.userName;
        servicePassword = configurationProvider.apiServices.password;
    }*/


    const res = await fetch('https://nodejs.org/api/documentation.json');
    //const res = await fetch(invocadorServicio.url_api_invocar, {method: invocadorServicio.metodo_invocacion, body: params});
    //loggerGlobal.debug('Hice la incovacion del URL: '+invocadorServicio.url_api_invocar);

    if (res.ok) {
        const data = await res.json();
        //loggerGlobal.debug('La data fue retornada para el servicio: '+invocadorServicio.nombre_del_servicio);
        //loggerGlobal.debug(JSON.stringify(data));
        return data;
    }
}

const InvocadorServicioAPI = {
    invocar : invocar,
}

export {InvocadorServicioAPI};
