//import {dbConnectionProvider} from '../db/dbConnectionManager.js';
import {FabricaErrores} from '../errors/errorsManager.js';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import DataLoader from 'dataloader';

export class EmpresaDataLoader {
    constructor(dbConnectionProvider) {
        this.dbConnectionProvider = dbConnectionProvider;
        this.empresasArray;
        loggerGlobal.debug('Instanciando el EmpresaDataLoader ... ');
    }

    empresasArray = new DataLoader(async (ids) => {
        if (!ids || !Array.isArray(ids) || ids.length < 1){
            throw FabricaErrores.crearError(
                FabricaErrores.TipoError.ErrorValidacionDatos,
                'Debe especificar los ids para consultar las empresas');
        }
    
        loggerGlobal.debug('Buscando las empresas en el DataLoader con ids: '+ids);

        const idsList = await this.getIdsList(ids);
        let query = `SELECT id,nombre_empresa,uid,fecha_hora_registro,fecha_hora_actualizacion 
                     FROM   empresa 
                     WHERE  id IN (${idsList}) 
                     AND    registro_esta_activo = true`;
        const empresasList = await this.dbConnectionProvider.many(query);

        loggerGlobal.debug('Recibi la lista de empresas ... voy a ordenarlas ');
        // Dataloader espera que se le retorne una lista con los resulados ordenados tal como se pasaron los ids
        // Ya que la BD podria retornar los resultados en un orden diferente, el siguiente fragmento los ordena como se espera
        const empresaIdToEmpresasMap = empresasList.reduce((mapping, empresa) => {
            mapping[empresa.id] = empresa;
            return mapping;
        }, {});

        return ids.map((id) => empresaIdToEmpresasMap[id]);
    });

    async getEmpresaFor(id) {
        return this.empresasArray.load(id);
    };

    async getIdsList(ids) {
        if (!ids || ids.length < 1) return '';

        let idsString = '';
        ids.forEach(id => {
            idsString += ','+id;
        });
        idsString = idsString.substring(1);
        return idsString;
    }
}

