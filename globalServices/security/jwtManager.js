import jwt from "jsonwebtoken";
import { loggerGlobal } from '../logging/loggerManager.js';
import { FabricaErrores } from '../../models/errors/errorsManager.js';
import { configurationProvider } from '../config/configurationManager.js';

export async function createAccessToken(paraAccesoPublico, usuario) {

  /*if (!!paraAccesoPublico){
    loggerGlobal.error('No se especificó el parametro paraAccesoPublico para determinar el tipo de token a generar');
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorSeguridad,
      'No se especificó el parametro para Acceso publico para poder generar el token');
  }*/

  if (paraAccesoPublico === false && (!usuario || !usuario.nombre_usuario || usuario.nombre_usuario.trim().length == 0 || 
                                                  !usuario.id || usuario.id < 1)){
    loggerGlobal.error('No se especifico el usuario.id para generar el token');
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorSeguridad,
      'No se especificó el usuario para generar el token');
  }

  try {
    let userId;
    let nombre_usuario;
    if (paraAccesoPublico === true){
        nombre_usuario = configurationProvider.security.jwtPublicAccessUser;
        userId = 0;
    }
    else{
        nombre_usuario =  usuario.nombre_usuario;
        //nombre_usuario =  '';//Dejo el nombre_usuario en blanco para que no viaje en el token cuando sea cliente autenticado
        userId = usuario.id;
    }

    const token = jwt.sign(
      {
        id: userId,
        nombre_usuario: nombre_usuario,
      },
      configurationProvider.security.jwtSecret,
      {
        expiresIn: Date.now() + (configurationProvider.security.jwtExpirationTime * 1000),
      }
    )
    return token;
  } catch (error) {
    loggerGlobal.error('Error al generar el token: '+error.message);
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorSeguridad,
      'Error al generar el token',error);
  }
}

export async function createPublicAccessToken() {
  try {
    const token = jwt.sign(
      {
        nombre_usuario: '_*_PublicUser_*_',
      },
      configurationProvider.security.jwtSecret,
    )
    return token;
  } catch (error) {
    loggerGlobal.error('Error al generar el token: '+error.message);
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorSeguridad,
      'Error al generar el token',error);
  }
}

// Verificación del jwt
export const verifyAccessToken = async (token) => {
  try {
    const decoded = jwt.verify(token, configurationProvider.security.jwtSecret)
    return decoded
  } catch (error) {
    loggerGlobal.error('Error al verificar el token: '+error.message);
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorSeguridad,
      'El usuario hizo una petición con un token invalido',error);
  }
}

const getUser = async (token) => {
  let payload;
  try {
    if (token && token.trim().length > 0) {
      loggerGlobal.debug('el token es: '+token);
      loggerGlobal.debug('el secret leido es: '+configurationProvider.security.jwtSecret);

      const [headerB64, payloadB64] = token.split('.');
      const headerStr = Buffer.from(headerB64,'base64').toString();
      const payloadStr = Buffer.from(payloadB64,'base64').toString();
      const header = JSON.parse(headerStr);

      if (header.alg === 'HS256'){
        loggerGlobal.debug('el algoritmo es valido ....');
      }else loggerGlobal.error('el algoritmo es invalido ....');

      payload = jwt.verify(token, configurationProvider.security.jwtSecret);

    }
    else{
      loggerGlobal.error('El token es nulo o está en blanco ... ');
      throw FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorSeguridad,
        'El usuario hizo una petición con un token invalido');
    }

  } catch (error) {
    loggerGlobal.error('Error al verificar el token: '+error.message);
    throw FabricaErrores.crearError(
      FabricaErrores.TipoError.ErrorSeguridad,
      'El usuario hizo una petición con un token invalido',error);
  }

  loggerGlobal.debug('El usuario en el token es: '+payload?.nombre_usuario);
  //loggerGlobal.debug('payload es: '+JSON.stringify(payload));
  
  if (payload && payload.nombre_usuario != configurationProvider.security.jwtPublicAccessUser){
    loggerGlobal.debug('Evaluando la expiración del token ... ');
    const ahoraMismo = Date.now();
    if (payload && ahoraMismo > payload.expiresIn){
      loggerGlobal.debug('Expiracion del token es: '+(payload.expiresIn - ahoraMismo));
      loggerGlobal.error('El token ya expiró ...');
        throw FabricaErrores.crearError(
          FabricaErrores.TipoError.ErrorSeguridad,
          'El token ya expiró');
    }
  }else loggerGlobal.debug('Es un acceso publico; no se verificara expiracion del token');

  return payload.nombre_usuario;
};

const jwtProvider = async ({ req, res }) => {

    loggerGlobal.debug('El operationName es: '+req.body.operationName);

    if (req.body.operationName === "IntrospectionQuery" ||
        req.body.operationName === "getTokenAccesoPublico" ||
        req.body.operationName === "CrearNuevaConversacion"
       ) {
          return {};
    }

    /*if (req.body.operationName === "getTokenAccesoPublico") {
        const {id: sub, name} = {id: 'jarguelles', name: 'Jorge'};

        const segundosExpiracion = 360;
        const token = jwt.sign({
          sub,
          //name,
          exp: Date.now() + (segundosExpiracion) * 1000,
        },configurationProvider.security.jwtSecret);

        loggerGlobal.debug('El token es: '+token);

        const dataToSecure = {token: token};
        res.cookie('secureCookie',JSON.stringify(dataToSecure),{
          secure:false,
          httpOnly: true,
          expires: new Date().setDate(Date.now() + 1),
        });
        loggerGlobal.debug('cree la cookie segura en el response ...');

        return {token,session: req.session};
    }*/

// obtener el token del usuario desde el headers
  const token = req.headers.authorization || "";
  loggerGlobal.debug('El token en la cabecera es: '+token);
  loggerGlobal.debug('El objeto session es: '+req.session.sessionVariables?.sessionId);
  loggerGlobal.debug('El token de la session es: '+req.session.sessionVariables?.tokenJWT);

  // Se intenta recuperar un usuario con el token
  const nombre_usuario = await getUser(token);
  const userNameCliente = req.session.sessionVariables?.userNameCliente;

  if (nombre_usuario && nombre_usuario !== userNameCliente){
      loggerGlobal.error('El usuario extraido del token es inválido, no se corresponde con el usuario autenticado en la sesión');

      throw FabricaErrores.crearError(
        FabricaErrores.TipoError.ErrorSeguridad,
        'El usuario del token es inválido');

  }

  // Añadir el usuario al contexto
  //loggerGlobal.debug('El userId en el token JWT es: '+userId);
  //return { userId, token, session: req.session };
  return { nombre_usuario };
};

export {jwtProvider};
