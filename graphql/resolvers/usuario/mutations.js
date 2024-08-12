import { createAccessToken } from '../../../globalServices/security/jwtManager.js';
import { loggerGlobal } from '../../../globalServices/logging/loggerManager.js'; 
import { Usuario } from '../../../models/businessObjects/usuario.js';

const usuarioMutations = {
    loginUsuario: async (_, {loginInput}, contextValue) => {
        console.log('voy a invocar loginUsuario ...');
        const usuario = await Usuario.loginUsuario(loginInput);

        console.log('Se autentico el usuario; solicitando un nuevo token ...');
        const newToken = createAccessToken(false, usuario);

        const usuarioConToken = {
            id: usuario.id,
            //nombre_usuario: usuario.nombre_usuario,
            tokenJWT: newToken,
        };        
        loggerGlobal.debug('El token generado es: '+newToken);
        
        if (contextValue.session.sessionVariables){
            contextValue.session.sessionVariables.tokenJWT = newToken;
            contextValue.session.sessionVariables.esAccesoPublico = false;
            contextValue.session.sessionVariables.userNameCliente = usuario.nombre_usuario;
            contextValue.session.sessionVariables.clienteId = usuario.clienteId;
            loggerGlobal.debug('Meti el token autenticado en el sessionVariables .. ');
        }

        return usuarioConToken;
    },
};
  
export {usuarioMutations};