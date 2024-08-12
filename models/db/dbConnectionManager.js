import pgPromise from 'pg-promise';
import { loggerGlobal } from '../../globalServices/logging/loggerManager.js';
import {configurationProvider} from '../../globalServices/config/configurationManager.js';
//const erroresModelo = import('../errors/erroresModelo_Manager.js');
//const ErrorCapaDatos = import('../errors/erroresModelo_Manager.js').ErrorCapaDatos;

let isConnected;
let db;
let pgp;
let variable;
//let verificarConexion;
let dbConnectionProvider;

if (!isConnected){

    try {
        pgp = pgPromise({
            capSQL: true,
            query(e) {
                loggerGlobal.debug('QUERY: '+ e.query);
            }, 
            error(errorBD,e){
                loggerGlobal.error('Imprimiendo el error de BD lanzado por pgp ...');
                loggerGlobal.error(errorBD);
                //OJO: trate de lanzar una excepcion propia desde aqui y no lo maneja bien
                //la libreria; queda como un error inesperado en el codigo fuente
                if (e.query){
                    /*e.query.then(queryError => {
                        loggerGlobal.error('Query con error obtenido por pgp: ');
                        loggerGlobal.error(queryError);
                    }).catch(error => {
                        loggerGlobal.error('Error en el evento error del dbConnectionManager, lanzado por pgp: ');
                        loggerGlobal.error(error);
                    });*/
                    loggerGlobal.error('Query con error obtenido por pgp: ');
                    loggerGlobal.error(e.query);
                }
            },
            receive(e) {
                const resultado = e.result.rows;
                loggerGlobal.info('Cantidad de filas retornadas: '+e.result.rowCount);

                //e.result.fields[2].dataTypeID = 1043;
                //e.result.fields[3].dataTypeID = 1043;

                /*
                for(let i = 0; i < resultado.length; i++){
                    console.log('Fila '+i);
                    const fila = resultado[i];
                    //const actualizado = new String(fila.updatedat);
                    if (fila.nombreguion) console.log('Nombre: '+fila.nombreguion);
                    else console.log('Nombre: '+fila.nombreempresa);
                    console.log('Creado: '+fila.fechahoraregistro);
                    console.log('Actualizado: '+fila.fechahoraactualizacion);
                    //fila.updatedat = actualizado;
                    //console.log('Creado modificado: '+fila.updatedat);
                };


                const columnas = e.result.fields;
                for(let i = 0; i < 4; i++){
                    console.log('Columna: '+columnas[i].name+' - tipo: '+columnas[i].dataTypeID);
                };
                //console.log('Filas: '+e.result.rowCount);
                console.log('Ahora el type del campo created es: '+e.result.fields[2].dataTypeID);*/
            }
        }); // Empty object means no additional config required

        const config = configurationProvider.db;

        db = pgp(config);
        //db = pgp(postgres);
        loggerGlobal.debug('Logre crear el objeto db con la configuracion del sistema ...');
        isConnected = true;
        loggerGlobal.info('Maximo de conexiones configuradas en pool: '+config.max);
        loggerGlobal.info('Conecciones SSL permitidas: '+config.ssl);
        loggerGlobal.debug('Ya tengo mi pool de conexiones ..'+db.$pool);
        loggerGlobal.info('Maximo de conexiones configuradas en pool: '+config.max);
        loggerGlobal.debug('idleTimeoutMillis: '+config.idleTimeoutMillis);
        loggerGlobal.debug('connectionTimeoutMillis: '+config.connectionTimeoutMillis);
        //console.log('Agregando otro log ...');
        variable = 'yes';

    }catch(error){
        loggerGlobal.error('Error al tratar de crear la conexion a BD: '+error);
        loggerGlobal.error(error);
    }
} 

async function verificarConexionBD() {
    try{
        const c = await db.connect(); // try to connect
        c.done(); // success, release connection
        return c.client.serverVersion; // return server version
    }catch(error)
    {
        loggerGlobal.error('Error al conectarse a la BD ...',error);
        return null;
    }
}

async function onePgMethod(query,values){
    return db.one(query,values);
}

async function oneOrNonePgMethod(query,values){
    return db.oneOrNone(query,values);
}

async function manyOrNonePgMethod(query,values){
    return db.manyOrNone(query,values);
}

async function manyPgMethod(query,values){
    return db.many(query,values);
}

async function concatPgMethod(query,values){
    return db.concat(query,values);
}

async function txPgMethod(args,cb){

    const respuesta = 
        await db.tx(args,cb)
            .then(data => {
                return data;
            })
            .catch(error => {
                return error;
            });
    return respuesta;
}

async function taskPgMethod(args,cb){

    const respuesta = 
        await db.task(args,cb)
            .then(data => {
                return data;
            })
            .catch(error => {
                return error;
            });
    return respuesta;
}

dbConnectionProvider = {
    helpers:pgp.helpers,
    pgpErrors:pgp.errors,
    one:onePgMethod,
    manyOrNone:manyOrNonePgMethod,
    many:manyPgMethod,
    oneOrNone:oneOrNonePgMethod,
    concat:concatPgMethod,
    tx:txPgMethod,
    task:taskPgMethod,
    verificarConexionBD:verificarConexionBD,
}

export {dbConnectionProvider};


