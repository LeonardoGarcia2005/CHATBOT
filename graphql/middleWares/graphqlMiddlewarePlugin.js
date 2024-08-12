import { loggerGlobal } from "../../globalServices/logging/loggerManager.js";
import { SessionVariables } from "./sessionVariables.js";

const myGraphqlMiddlewarePluggin = {
  
    async requestDidStart(requestContext) {

        if (requestContext.contextValue.session){
            loggerGlobal.debug('recibi el session ... '+requestContext.contextValue.session.id);
            
            const session = requestContext.contextValue.session;
            if (!session.sessionVariables){
                session.sessionVariables = new SessionVariables(session.id);
            }
            
        }
        else loggerGlobal.error('No recibi el objeto para el session Management ... ');
    
        return {
            // Fires whenever Apollo Server will parse a GraphQL
            // request to create its associated document AST.
            async parsingDidStart(requestContext) {
                loggerGlobal.debug('Se inicio el analisis sintactico del query graphql ...');
            },
      
            // Fires whenever Apollo Server will validate a
            // request's document AST against your GraphQL schema.
            async validationDidStart(requestContext) {
                loggerGlobal.debug('Iniciando la validacion del query contra el graphql schema ...');
            },

            willSendResponse({ response, context }) {
              // Obtener el sessionID del contexto (puedes adaptar esto según tu lógica de autenticación)
              const sessionID = requestContext.contextValue.session.id;  //context.req.sessionID;
  
              // Enviar el sessionID como parte de los headers de la respuesta
              response.http.headers.set('sessionID', sessionID);
              loggerGlobal.debug('MIDDLEWARE: el sessionID a enviar al cliente es: '+sessionID);
            },


            /*async executionDidStart(requestContext) {
                loggerGlobal.debug('Iniciando la ejecucion del query contra el graphql schema ...');
                return {
                  willResolveField({ source, args, requestContext, info }) {
                    if (info.parentType.name === 'GuionConversacion' && info.fieldName === 'empresa'){
                      //console.log('source: '+JSON.stringify(source));
                      //console.log('args: '+JSON.stringify(args));

                      /*if (requestContext){
                        console.log(JSON.stringify(requestContext));
                        if (requestContext.contextValue){
                          console.log('recibi contextValue ...');
                          if (requestContext.contextValue.empresa){
                            console.log('recibi la empresa del contexto ...');
                            return requestContext.contextValue.empresa;
                          }
                        }
                      }else console.log('requestContext me llego en null ...');*/
                      /*const empresa = source.empresa;
                      console.log('la empresa leida es: '+JSON.stringify(empresa));
                      return { data: source.empresa};
                    }
                    if (info.parentType.name === 'Empresa' && info.fieldName === 'nombre_empresa'){
                      //console.log('source: '+JSON.stringify(source));
                      //console.log('args: '+JSON.stringify(args));
                      const empresa = source.nombre_empresa;
                      console.log('el nombre de la empresa leida es: '+JSON.stringify(empresa));
                      return { data: empresa};
                    }
                    const start = process.hrtime.bigint();
                    return (error, result) => {
                      const end = process.hrtime.bigint();
                      console.log(`Field ${info.parentType.name}.${info.fieldName} took ${end - start}ns`);
                      if (error) {
                        console.log(`It failed with ${error}`);
                      } else {
                        console.log(`It returned ${result}`);
                      }
                    };
                  },
                };
            },*/
            
            async responseForOperation(requestContext) {
                loggerGlobal.debug('Ejecutando el responseForOperation ...');
                if (requestContext.contextValue.empresasDataLoader){
                  loggerGlobal.debug('Obtuve la empresa en el responseForOperation ...');
                }
            }
        };
    },
}

export {myGraphqlMiddlewarePluggin}