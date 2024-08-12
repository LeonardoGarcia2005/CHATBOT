import { GraphQLError } from 'graphql';
import {GuionConversacion} from '../../../models/businessObjects/guionConversacion.js'

const guionConversacionQueries = {
    
    guionesConversacion: async (_, args) => {
        return await GuionConversacion.consultarTodos();
    },
    
    consultarGuion_CrearConversacion: async (_, {id}, contextValue) => {

        if (contextValue){
            console.log('recibi el contexto en la llamada ...');
            if (contextValue.session){
                /*console.log('vino el objeto session en el contexto ...');
                let sessionVariables = contextValue.session.sessionVariables;
                if (sessionVariables && sessionVariables.variablesMap && sessionVariables.variablesMap.has('contador')){
                    let contadorInt = parseInt(sessionVariables.variablesMap.get('contador'));
                    contadorInt++;
                    sessionVariables.variablesMap = sessionVariables.variablesMap.set('contador',contadorInt);
                    console.log('cantidad de veces que he consultado el guion: '+contadorInt);
                }
                else{
                    console.log('cantidad de veces que he consultado el guion: '+1);
                    sessionVariables.variablesMap = sessionVariables.variablesMap.set('contador',1);
                }*/
                
                /*if (contextValue.session.contadorViews){
                    contextValue.session.contadorViews = contextValue.session.contadorViews + 1;
                    console.log('cantidad de veces que he consultado el guion: '+(contextValue.session.contadorViews));
                }
                else{ 
                    console.log('cantidad de veces que he consultado el guion: '+1);
                    contextValue.session.contadorViews = 1;
                }*/
            }
        }
        else console.log('No recibi ningun contexto ...');

        const guion = await GuionConversacion.consultarGuion_CrearConversacion(id);
        //console.log('ya consulte el guion ...');

        if (guion && guion.empresa){
            contextValue.empresa = guion.empresa;
            console.log('Meti la empresa en el contexto ...');
        }

        return guion;
    },
  };
  
export {guionConversacionQueries};