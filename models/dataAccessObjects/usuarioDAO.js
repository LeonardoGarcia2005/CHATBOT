import {dbConnectionProvider} from '../db/dbConnectionManager.js'; 
import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';

const consultarUsuarioLogin_query = (loginInput) => {
    if (!loginInput || !loginInput.nombre_usuario || !loginInput.nombre_usuario.trim().length == 0 
                    || !loginInput.clave || !loginInput.clave.trim().length == 0){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el nombre de usuario y clave para poder autenticar al usuario');
    }

    const query = `SELECT       id,nombre_usuario,clave_usuario 
                   FROM         usuario
                   WHERE        nombre_usuario=${loginInput.nombre_usuario}`;
    
    return query;
}


const consultarUsuarioLogin = async (loginInput) => {

    let respuesta;

    try
    {
        const query = consultarUsuarioLogin_query(loginInput);
        respuesta = await dbConnectionProvider.one(query,values);

    }
    catch(error){
        loggerGlobal.error('Error al intentar autenticar  al usuario: '+loginInput.nombre_usuario);
        loggerGlobal.error(error);
        respuesta = error;
    }

    if (respuesta && respuesta instanceof Error){
        loggerGlobal.error('El nombre_usuario/clave especificados no están registrados en la Base de Datos. Usuario: '+loginInput.nombre_usuario);
        if (respuesta instanceof dbConnectionProvider.pgpErrors.QueryResultError &&
            respuesta.code === dbConnectionProvider.pgpErrors.queryResultErrorCode.noData){
                throw FabricaErrores.crearError(
                    FabricaErrores.TipoError.ErrorSeguridad,
                    `El nombre_usuario/clave especificados no están registrados en la Base de Datos`);
    }
        else{
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorCapaDatos,
                `Error en la capa de datos al intentar autenticar al usuario ${loginInput.nombre_usuario}`,respuesta);
        }
    }
    
    loggerGlobal.debug('Respuesta en el metodo loginUsuario de usuarioDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const consultarUsuarioPorNombre_query = (nombreUsuario) => {
    if (nombreUsuario && nombreUsuario.trim().length == 0){
        throw FabricaErrores.crearError(
            FabricaErrores.TipoError.ErrorValidacionDatos,
            'Debe especificar el nombre de usuario para poder consultarlo');
    }

    const query = `SELECT       id,nombre_usuario,clave_usuario 
                   FROM         usuario
                   WHERE        nombre_usuario='${nombreUsuario}'`;
    
    return query;
}


const consultarUsuarioPorNombre = async (nombreUsuario) => {

    let respuesta;

    try
    {
        const query = consultarUsuarioPorNombre_query(nombreUsuario);
        respuesta = await dbConnectionProvider.one(query);

    }
    catch(error){
        loggerGlobal.error('Error al consultar al usuario especificado: '+nombreUsuario);
        loggerGlobal.error(error);
        return null;
    }

    loggerGlobal.debug('Respuesta en el metodo consultarUsuarioPorNombre de usuarioDAO: ');
    loggerGlobal.debug(respuesta);
    return respuesta;
}

const UsuarioDAO = {
    consultarUsuarioLogin: consultarUsuarioLogin,
    consultarUsuarioPorNombre: consultarUsuarioPorNombre,
}

export {UsuarioDAO};
