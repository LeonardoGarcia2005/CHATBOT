const dotenv = require('dotenv');
dotenv.config();

const pgPromise = require('pg-promise');
const manejarErrores = import('../errors/erroresModeloManager.js');

let isConnected;
let db;
let puertoWeb;
let pgp;
let variable;
//let verificarConexion;
let servicioConexionBD;

if (!isConnected){

    try {
        pgp = pgPromise({
            capSQL: true,
            query(e) {
                console.log('QUERY:', e.query);
            }, 
            error(errorBD,e){
                console.log('Por aqui imprimiendo un error de BD ...');
                console.log(errorBD);
                if (errorBD.code === pgPromise.errors.queryResultErrorCode.noData){
                    manejarErrores
                    const errorDatos = new ErrorCapaDatos('No se encontro la data especificada',errorBD);
                    throw errorDatos;
                    //console.log('Es un error de data no encontrada ...');
                }
            },
            receive(e) {
                const resultado = e.result.rows;
                console.log('Cantidad de filas retornadas: '+e.result.rowCount);

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

        const config = {
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT,
            database: process.env.POSTGRES_DB,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            puertoWeb: process.env.PUERTO_WEB,
            ssl: false,
            max: process.env.PG_POOL_MAX, // set pool max size to 10
            idleTimeoutMillis: process.env.PG_POOL_IDLE_TIMEOUT_MILLIS, // close idle clients after 1 second
            connectionTimeoutMillis: process.env.PG_POOL_IDLE_TIMEOUT_MILLIS, // return an error after 1 second if connection could not be established
            maxUses: process.env.PG_POOL_MAX_USES,
        };

        db = pgp(config);
        //db = pgp(postgres);
        console.log('Logre crear el objeto db con el config ...');
        isConnected = true;
        console.log('El puerto leido '+config.puertoWeb);
        puertoWeb = config.puertoWeb;
        console.log(`tengo el objeto config: `+db.$config.options);
        //console.log(`Maximo de conexiones en el pool: `+db.$config.database);
        console.log('Maximo de conecciones configuradas en pool: '+config.max);
        console.log('Conecciones SSL permitidas: '+config.ssl);
        console.log('Ya tengo mi pool de conexiones ..'+db.$pool);
        variable = 'yes';

    }catch(error){
        console.log('Error al tratar de crear la conexion a BD: '+error);
    }
} 

async function verificarConexionBD() {
    try{
        const c = await db.connect(); // try to connect
        c.done(); // success, release connection
        return c.client.serverVersion; // return server version
    }catch(error)
    {
        console.log('Error al conectarse a la BD ...',error);
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

servicioConexionBD = {
    helpers:pgp.helpers,
    pgpErrors:pgp.errors,
    one:onePgMethod,
    manyOrNone:manyOrNonePgMethod,
    oneOrNone:oneOrNonePgMethod,
    concat:concatPgMethod,
    tx:txPgMethod,
    verificarConexionBD:verificarConexionBD,
}

exports.puertoWeb=puertoWeb;
exports.servicioConexionBD=servicioConexionBD;


