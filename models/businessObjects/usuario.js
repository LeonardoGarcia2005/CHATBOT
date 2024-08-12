import {FabricaErrores} from '../errors/errorsManager.js'
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import { UsuarioDAO } from '../dataAccessObjects/usuarioDAO.js';
import { comparePassword,encryptPassword } from '../../globalServices/security/bcrypt.js';

const loginUsuario = async (loginInput) => {
    const usuario = UsuarioDAO.consultarUsuarioLogin(loginInput);

    //Agregar aqui logica para comparar clave encriptada
    if (!comparePassword(loginInput.clave,usuario.clave_usuario)){
        loggerGlobal.error('Error al validar la clave del usuario... ');
        
        /*throw FabricaErrores.crearError(
          FabricaErrores.TipoError.ErrorSeguridad,
          'Error al intentar autenticar el usuario: '+loginInput.nombre_usuario);*/
          return null;
    }

    return usuario;
}

export function nombreUsuarioEsValido(nombreUsuario){
    
    if (!nombreUsuario || nombreUsuario.trim().length < 10 || nombreUsuario.trim().length > 30) 
        return false;
    
    return true;
}

export function claveUsuarioEsValida(clave){
    
    if (!clave || clave.trim().length < 6 || clave.trim().length > 30) 
        return false;
    
    return true;
}

const consultarUsuarioPorNombre = async (nombreUsuario) => {
    const usuario = UsuarioDAO.consultarUsuarioPorNombre(nombreUsuario);

    return usuario;
}

const Usuario = {
    loginUsuario : loginUsuario,
    consultarUsuarioPorNombre: consultarUsuarioPorNombre,
}

export {Usuario};