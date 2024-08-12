/* 
En este archivo se pueden manejar de forma centralizada todos los errores que lleguen o 
se produzcan en la capa de Graphql (Controler). Por aquí pasan todos los errores antes 
de dar la respuesta al cliente, en caso de que se use este objeto formateadorErrores
que es exportado en este módulo, como parámetro al crear el ApolloServer
*/

import { ApolloServerErrorCode } from '@apollo/server/errors';
import { GraphQLError } from 'graphql';
import { unwrapResolverError } from '@apollo/server/errors';
import {ErrorCapaDatos, ErrorDatosNoEncontrados, ErrorSeguridad, ErrorValidacionDatos} from '../../models/errors/errorsManager.js'
import {FabricaErrores} from '../../models/errors/errorsManager.js'
import {dbConnectionProvider} from '../../models/db/dbConnectionManager.js'
import { loggerGlobal } from "../../globalServices/logging/loggerManager.js";

const errorsFormatter = (formattedError, error) => {
    loggerGlobal.error('Estoy capturando en el formateador de errores ...');
    loggerGlobal.error(formattedError.message);

    // Returna el mensaje especificado si el error es de esquema GraphQL invalido
    if (formattedError.extensions.code === ApolloServerErrorCode.GRAPHQL_PARSE_FAILED) {
        return {
            ...formattedError,
            message: "Error de sintaxis en la consulta Graphql enviada",
        };
    } 
    if (formattedError.extensions.code === ApolloServerErrorCode.GRAPHQL_VALIDATION_FAILED) {
        return {
            ...formattedError,
            message: "Operacion Invalida de acuerdo al Graphql schema definido para este sistema",
        };
    }  
    if (formattedError.extensions.code === ApolloServerErrorCode.BAD_USER_INPUT) {
        return {
            ...formattedError,
            message: "La consulta graphql enviada tiene un valor invalido en uno de los argumentos especificados",
        };
    }  
    if (formattedError.extensions.code === ApolloServerErrorCode.PERSISTED_QUERY_NOT_FOUND) {
        return {
            ...formattedError,
            message: "El hash enviado para un query graphql almacenado no fue encontrado en el cache APQ",
        };
    }  
    if (formattedError.extensions.code === ApolloServerErrorCode.OPERATION_RESOLUTION_FAILURE) {
        return {
            ...formattedError,
            message: "El request incluye varias consultas nombradas pero no especifico cual ejecutar; o la consulta nombrada no fue incluida en el request",
        };
    }  
    if (formattedError.extensions.code === ApolloServerErrorCode.BAD_REQUEST) {
        return {
            ...formattedError,
            message: "Ocurrio un error antes de que el servidor pudiera intentar interpretar la consulta graphql enviada",
        };
    }  
    
    loggerGlobal.warn('Hasta ahora no va ninguno de los errores tipificados de Graphql ...');

    //******************************************************************************************* */
    //Si no es ninguno de los errores de GraphqQL tipificados, evaluamos si es uno de los errores
    //definidos en la jerarquia de errores de nuestro sistema
    const backendError = unwrapResolverError(error);
    loggerGlobal.info(JSON.stringify(error));
    loggerGlobal.info(JSON.stringify(backendError));
    loggerGlobal.info('el tipo del error es: '+(typeof backendError));

    if (backendError instanceof ErrorValidacionDatos){
        loggerGlobal.warn('Capture un Error de Validacion de datos ...');
        let originalErrorMessage = '';
        if (backendError.cause){
            loggerGlobal.error('El error original es: '+backendError.cause);
            originalErrorMessage += backendError.cause;
        }

        return {
            ...formattedError,
            message: backendError.message,
            extensions: {
              code: FabricaErrores.TipoError.ErrorValidacionDatos,
              originalMessage: originalErrorMessage,
            }
        };
    }
    
    if (backendError instanceof ErrorDatosNoEncontrados){
        loggerGlobal.error('Capture un Error de datos no encontrados ...');
        let originalErrorMessage = '';
        /*if (backendError.cause){
            loggerGlobal.error('El error original es: '+backendError.cause);
            //originalErrorMessage += backendError.cause;
        }*/

        return {
            ...formattedError,
            message: backendError.message,
            extensions: {
              code: FabricaErrores.TipoError.ErrorDatosNoEncontrados,
              originalMessage: originalErrorMessage,
            }
        };
    }
     
    if (backendError instanceof ErrorCapaDatos) {
        loggerGlobal.error('Capture un Error de Capa de datos ...');
        let originalErrorMessage = '';
        if (backendError.cause){
            loggerGlobal.error('El error original es: '+backendError.cause);
            originalErrorMessage += backendError.cause;
        }

        return {
            ...formattedError,
            message: backendError.message,
            extensions: {
              code: FabricaErrores.TipoError.ErrorCapaDatos,
              originalMessage: originalErrorMessage,
            }
        };
    }  
     
    if (backendError instanceof ErrorSeguridad ||
        (backendError.message && backendError.message.toUpperCase().includes('ERROR DE SEGURIDAD'))) {
        loggerGlobal.error('Capture un Error de Seguridad: '+backendError.message);
        let originalErrorMessage = '';

        return {
            ...formattedError,
            message: backendError.message,
            extensions: {
              code: FabricaErrores.TipoError.ErrorSeguridad,
              originalMessage: originalErrorMessage,
            }
        };
    }  
     
    const errorCause = backendError.cause;
    if (errorCause && (
        errorCause instanceof dbConnectionProvider.pgpErrors.QueryResultError ||
        errorCause instanceof dbConnectionProvider.pgpErrors.QueryFileError ||
        errorCause instanceof dbConnectionProvider.pgpErrors.PreparedStatementError ||
        errorCause instanceof dbConnectionProvider.pgpErrors.ParameterizedQueryError)
    ) {
        loggerGlobal.error('Capture un Error de la capa de datos lanzado por pgp No debidamente envuelto con los errores del sistema ...');
        loggerGlobal.error(backendError.message);
        loggerGlobal.error(''+errorCause);
        return {
            ...formattedError,
            message: backendError.message,
            extensions: {
              code: FabricaErrores.TipoError.ErrorCapaDatos,
              originalMessage: ''+errorCause,
            }
        };
    }  
             
    if (formattedError.extensions.code === ApolloServerErrorCode.INTERNAL_SERVER_ERROR &&
        backendError.query
    ) {
        loggerGlobal.error('Capture un Error de la capa de datos lanzado por pgp No debidamente envuelto con los errores del sistema ...');
        loggerGlobal.error(backendError.message);
        return {
            ...formattedError,
            message: "Error al tratar de ejecutar una transaccion contra la BD",
            extensions: {
                code: FabricaErrores.TipoError.ErrorCapaDatos,
                originalMessage: backendError.message,
            }
        }
    }  
    
    if (formattedError.extensions.code === ApolloServerErrorCode.INTERNAL_SERVER_ERROR){
        loggerGlobal.error('Ocurrio un error no manejado en el servidor (Internal Server Error)');

        let originalErrorMessage = '';
        if (backendError){
            loggerGlobal.error('El error original es: '+backendError);
            loggerGlobal.error(backendError.stack);
            originalErrorMessage += backendError;
        }
        return {
            ...formattedError,
            message: "Error no manejado en el servidor (Internal Server Error)",
            extensions: {
                code: FabricaErrores.TipoError.ErrorGenericoNoManejado,
                originalMessage: originalErrorMessage,
            }
        }
    }  
      
      // Si no es un error de tipo GraphQL o de la jerarquia del sistema, retorna el error original
    return formattedError;
  }

const graphqlErrorManager = {
    errorsFormatter:errorsFormatter,
};

export {graphqlErrorManager};