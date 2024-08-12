import { createPublicAccessToken,createAccessToken } from '../../../globalServices/security/jwtManager.js';
import { loggerGlobal } from '../../../globalServices/logging/loggerManager.js'; 
import { configurationProvider } from '../../../globalServices/config/configurationManager.js';

const usuarioQueries = {
    getTokenAccesoPublico: async (_, args, contextValue) => {
        console.log('voy a invocar createPublicAccessToken ...');
        const token = await createAccessToken(true,null);
        const userToken = {
            id: null,
            nombre_usuario: null,
            tokenJWT: token,
        }
        loggerGlobal.debug('El token es: '+token);
        
        if (contextValue.session.sessionVariables){
            contextValue.session.sessionVariables.tokenJWT = token;
            contextValue.session.sessionVariables.esAccesoPublico = true;
            contextValue.session.sessionVariables.userNameCliente = configurationProvider.security.jwtPublicAccessUser;
            contextValue.session.sessionVariables.clienteId = 0;
            loggerGlobal.debug('Meti el token en el sessionVariables .. ');
        }

        return userToken; //JSON.parse(clienteToken);
    },
  };
  
  export {usuarioQueries};