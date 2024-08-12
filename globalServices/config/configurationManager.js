import {FabricaErrores} from '../../models/errors/errorsManager.js';
import dotenv from 'dotenv';
dotenv.config();
import config from '../../config.cjs';

let configurationProvider;

if (!configurationProvider){
    configurationProvider = {
      db : {
        host: config.get('db.host'),
        port: config.get('db.port'),
        database: config.get('db.name'),
        user: config.get('db.user'),
        password: config.get('db.password'),
        ssl: false,
        max: config.get('pgPromise.max'),
        idleTimeoutMillis: config.get('pgPromise.idleTimeoutMillis'),
        connectionTimeoutMillis: config.get('pgPromise.connectionTimeoutMillis'),
        maxUses: config.get('pgPromise.maxUses'),
      },
      system : {
        userName: config.get('system.userName'),
        userId: config.get('system.userId'),
      },
      services : {
        host: config.get('services.host'),
        port: config.get('services.port'),
      },
      maxLogLevel: config.get('maxLogLevel'),
      messengerAPI : {
        apiDomain : config.get('messengerAPI.apiDomain'),
        apiVersion : config.get('messengerAPI.apiVersion'),
        activate : config.get('messengerAPI.activate'),
      },
      pageAppForMessenger : {
        pageId : config.get('pageAppForMessenger.pageId'),
        appId : config.get('pageAppForMessenger.appId'),
        pageAccesToken : config.get('pageAppForMessenger.pageAccesToken'),
        appSecret : config.get('pageAppForMessenger.appSecret'),
        verifyToken : config.get('pageAppForMessenger.verifyToken'),
      },
      WebChannel : {
        activate : config.get('WebChannel.activate'),
      },
      channelIds : {
        WebId : config.get('channelIds.WebId'),
        FacebookMessengerId : config.get('channelIds.FacebookMessengerId'),
        WhatsAppId : config.get('channelIds.WhatsAppId'),
        InstagramId : config.get('channelIds.InstagramId'),
      },
      clientSession: {
        secret: config.get('clientSession.secret'),
      },
      apiServices: {
        userName: config.get('apiServices.userName'),
        password: config.get('apiServices.password'),
      },
      security: {
        jwtSecret: config.get('security.jwtSecret'),
        jwtPublicAccessUser: config.get('security.jwtPublicAccessUser'),
        jwtExpirationTime: config.get('security.jwtExpirationTime'),
      },
      pageAppForWhatsapp : {
        jwtToken: config.get('pageAppForWhatsapp.jwtToken'), 
        numberId: config.get('pageAppForWhatsapp.numberId'),
        verifyToken: config.get('pageAppForWhatsapp.verifyToken'), 
        version: config.get('pageAppForWhatsapp.version')
      }
    };
}

export {configurationProvider}
