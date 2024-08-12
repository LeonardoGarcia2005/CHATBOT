const dotenv = require('dotenv');
dotenv.config();
var convict = require('convict');

convict.addFormat(require('convict-format-with-validator').ipaddress);
convict.addFormat(require('convict-format-with-validator').url);

// Define a schema
var config = convict({
  env: {
    doc: 'Representa el ambiente de corrida del sistema y su correspondiente archivo de variables de entorno',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
    arg: 'env',
  },
  services: {
    host: {
      doc: 'Nombre del servidor que provee los servicios del backend',
      format: '*',
      default: 'localhost',
      sensitive: true,
    },
    port: {
      doc: 'Puerto del servidor que provee los servicios del backend',
      format: 'port',
      default: 8080,
    }
  },
  db: {
    host: {
      doc: 'Nombre del servidor de BD en el dominio',
      format: '*',
      default: 'localhost',
      env:'localhost',
      sensitive: true,
    },
    port: {
      doc: 'Puerto del servidor de BD',
      format: 'port',
      default: 1,
    },
    name: {
      doc: 'Nombre de la BD',
      format: String,
      default: 'postgres'
    },
    user: {
      doc: 'Usuario para acceder a la BD',
      format: String,
      default: 'postgres',
      //sensitive: true,
    },
    password: {
      doc: 'Clave para acceder a la BD',
      format: String,
      default: 'jorgePost$',
      //sensitive: true,
    }
  },
  system: {
    userName: {
      doc: 'Nombre del usuario que representa el sistema en la BD de usuarios, para registrar los mensajes del sistema con ese username',
      format: String,
      default: 'systemUser',
      sensitive: true,
    },
    userId: {
      doc: 'Id del usuario que representa al sistema en la BD de usuarios',
      format: Number,
      default: 1,
    }
  },
  pgPromise: {
    ssl: {
      doc: 'Indica si el acceso a la BD Postgres utiliza SSL para conectarse',
      format: Boolean,
      default: false,
    },
    max: {
      doc: 'Indica la cantidad maxima de conexiones a BD mantenidas en el Pool',
      format: 'nat',
      default: 10,
    },
    idleTimeoutMillis: {
      doc: 'Cantidad de milisegundos a esperar antes de cerrar una conexion inactiva en el Pool',
      format: 'nat',
      default: 5000,
    },
    connectionTimeoutMillis: {
      doc: 'Cantidad de milisegundos antes de lanzar un error si no se puede establecer una conexion para el Pool',
      format: 'nat',
      default: 1000,
    },
    maxUses: {
      doc: 'Cantidad maxima de veces a utilizar una conexion del Pool',
      format: 'nat',
      default: 7500,
    },
  },
  maxLogLevel: {
    doc: 'Maximo nivel de logs requeridos en la corrida del sistema',
    format: String,
    default: 'debug',
  },
  messengerAPI: {
    apiDomain: {
      doc: 'URL del dominio de la API de Facebook Messenger',
      format: 'url',
      default: 'https://graph.facebook.com',
    },
    apiVersion: {
      doc: 'Version usada de la API de Facebook Messenger',
      format: String,
      default: 'v11.0'
    },
    activate: {
      doc: 'Indica si se activa o no el módulo del canal por Facebook Messenger en el sistema ',
      format: Boolean,
      default: false,
      //arg: 'messengerAPI.activate',
    }
  },
  pageAppForMessenger: {
    pageId: {
      doc: 'Id de la pagina de empresa en la que se activará el Messenger. Se obtiene del Panel de Aplicaciones de Meta for Developers',
      format: Number,
      default: 107975295725722,
    },
    appId: {
      doc: 'Id de la Aplicacion configurada con el Webhook, en el Panel de Aplicaciones de Meta for Developers',
      format: Number,
      default: 327630493031641
    },
    pageAccesToken: {
      doc: 'Token generado por el Panel de Aplicaciones de Meta for Developers, en base al pageId',
      format: String,
      default: 'EAAEpZBmsnnNkBO3XcF0uY7CtZBsmXCJYgihQF3uy4YvI1OCaCPtPCmEIICO0bm03NrqAHlZB7PPETo6HZAXlDhfJfjrhatodQsac71ZBTPIAwXjDmesGiV06WdnBC9yhnwYYZBAP48deHwTVd5tFQgs5E6oRLtVZB0NiDiozuTsSuNNTnzNcP1LkZB1NPk425IVo399e'
    },
    appSecret: {
      doc: 'Cadena hexadecimal obtenida a partir del appId, generada por el Panel de Aplicaciones de Meta for Developers',
      format: String,
      default: '7ba6d6dd213d0e5fd5afb2e9d5ab1466'
    },
    verifyToken: {
      doc: 'Cadena configurada para la aplicación creada en el Panel de Aplicaciones de Meta for Developers',
      format: String,
      default: 'BusinessFirstOne'
    },
  },
  WebChannel: {
    activate: {
      doc: 'Indica si se activa o no el módulo del canal por WEB en el sistema ',
      format: Boolean,
      default: true,
    }
  },
  channelIds: {
    WebId: {
      doc: 'Id del canal WEB en este sistema',
      format: Number,
      default: 1
    },
    FacebookMessengerId: {
      doc: 'Id del canal Facebook Messenger en este sistema',
      format: Number,
      default: 2
    },
    WhatsAppId: {
      doc: 'Id del canal WhatsApp en este sistema',
      format: Number,
      default: 3
    },
    InstagramId: {
      doc: 'Id del canal Instagram en este sistema',
      format: Number,
      default: 4
    },
  },
  clientSession: {
    secret: {
      doc: 'Es la cadena usada para crear la sesion web para cada cliente del sistema ',
      format: String,
      default: '__chatgea$',
    }
  },
  apiServices: {
    userName: {
      doc: 'Es el usuario con el cual se accede a los servicios API que se vayan a invocar ',
      format: String,
      default: '',
    },
    password: {
      doc: 'Es el password con el cual se accede a los servicios API que se vayan a invocar ',
      format: String,
      default: '',
    },
  },
  security: {
    jwtSecret: {
      doc: 'Es la cadena usada como Secret por el JWT para la firma del token',
      format: String,
      default: '',
      env: 'security.jwtSecret',
    },
    jwtPublicAccessUser: {
      doc: 'Es la cadena usada como Username para generar un token JWT para un cliente no registrado o todavía no autenticado, que está accediendo al sistema',
      format: String,
      default: '',
      env: 'security.jwtPublicAccessUser',
    },
    jwtExpirationTime: {
      doc: 'Es la duración válida del token JWT enviado al cliente autenticado, expresada en Segundos',
      format: Number,
      default: 600,
      env: 'security.jwtExpirationTime',
    },
  },
});

// Load environment dependent configuration
var env = config.get('env');
config.loadFile('./src/' + env + '.json');
console.log('Cargando archivo de configuracion: '+env + '.json');
//console.log('Los valores del esquema son: \n'+config.toString());

// Perform validation
config.validate({allowed: 'strict'});

module.exports = config;