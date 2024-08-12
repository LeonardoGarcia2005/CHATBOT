import {InvocadorServicioAPI} from '../../../models/businessObjects/invocadorServicioAPI.js'

const invocadorQueries = {
    
    invocarServicioAPI: async (_, args) => {
        return await InvocadorServicioAPI.invocar();
    },
}   

export {invocadorQueries};
