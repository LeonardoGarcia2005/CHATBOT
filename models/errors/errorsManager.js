import pgPromise from "pg-promise";

let FabricaErrores;

const TipoError = {
    //Jerarquia para errores del Negocio
    ErrorGenericoNoManejado : -1,

    //Jerarquia para errores de configuracion de Plataforma
    ErrorConfiguracionPlataforma : 1,
    
    //Jerarquia para errores de Validacion de datos
    ErrorValidacionDatos : 2,

    //Jerarquia para errores de la capa de Datos
    ErrorCapaDatos : 3,
    ErrorDatosNoEncontrados : 31,
    ErrorConfiguracionDatos : 32,

    //Jerarquia para errores del Negocio
    ErrorNegocio : 4,

    //Jerarquia para errores de Seguridad
    ErrorSeguridad : 5,
    ErrorUsuarioRequiereAutenticacion : 51,
}

class ClaseBaseError extends Error {
    constructor(message, cause){
        super(message);
        this.cause = cause;
        this.name = this.constructor.name;
        this.message = message;
        if (cause){ 
            Error.captureStackTrace(this, this.name);
        }
        //const error = new Error('');
        //this.sta
    };
}

export class ErrorValidacionDatos extends ClaseBaseError {
    constructor(message, cause){
        const cadenaPrefijo = 'Error de Validacion de Datos de entrada: ';
        super(cadenaPrefijo + (message || ''), cause);
    };
}

export class ErrorCapaDatos extends ClaseBaseError {
    constructor(message, cause){
        const cadenaPrefijo = 'Error de Base de Datos: ';
        super(message, cause);
    };
}

export class ErrorDatosNoEncontrados extends ErrorCapaDatos {
    constructor(message, cause){
        const cadenaPrefijo = 'Error de datos: ';
        super(cadenaPrefijo + message, cause);
    };
}

export class ErrorConfiguracionDatos extends ErrorCapaDatos {
    constructor(message, cause){
        const cadenaPrefijo = 'Error en la configuracion de los datos en la BD: ';
        super(cadenaPrefijo + message, cause);
    };
}

export class ErrorConfiguracionPlataforma extends ClaseBaseError {
    constructor(message, cause){
        const cadenaPrefijo = 'Error de configuracion de la Plataforma: ';
        super(cadenaPrefijo + message, cause);
    };
}

export class ErrorNegocio extends ClaseBaseError {
    constructor(message, cause){
        super(message, cause);
    };
}

export class ErrorSeguridad extends ClaseBaseError {
    constructor(message, cause){
        const cadenaPrefijo = 'Error de Seguridad: ';
        super(cadenaPrefijo + (message || ''), cause);
    };
}

export class ErrorUsuarioRequiereAutenticacion extends ErrorSeguridad {
    constructor(message, cause){
        super((message || ''), cause);
    };
}

function manejarErrorPGP(errorPGP,eventoError){
    console.log('Determinando el error lanzado por PGP ...')
    if (errorPGP.code === pgPromise.errors.queryResultErrorCode.noData){
        const errorDatos = new ErrorCapaDatos('No se encontro la data especificada',errorPGP);
        throw errorDatos;
        //console.log('Es un error de data no encontrada ...');
    }

}

class FabricaError {
    constructor(){};

    crearError(tipoError, mensajeError, causaError){
        switch (tipoError){
            case TipoError.ErrorValidacionDatos:
                return new ErrorValidacionDatos(mensajeError,causaError);
            case TipoError.ErrorCapaDatos:
                return new ErrorCapaDatos(mensajeError,causaError);
            case TipoError.ErrorDatosNoEncontrados:
                return new ErrorDatosNoEncontrados(mensajeError,causaError);
            case TipoError.ErrorConfiguracionDatos:
                return new ErrorConfiguracionDatos(mensajeError,causaError);
            case TipoError.ErrorConfiguracionPlataforma:
                return new ErrorConfiguracionPlataforma(mensajeError,causaError);
            case TipoError.ErrorNegocio:
                return new ErrorNegocio(mensajeError,causaError);
            case TipoError.ErrorSeguridad:
                return new ErrorSeguridad(mensajeError,causaError);
            case TipoError.ErrorUsuarioRequiereAutenticacion:
                return new ErrorUsuarioRequiereAutenticacion(mensajeError,causaError);
                            
        }
    }
}

if (!FabricaErrores){
    FabricaErrores = new FabricaError();
    FabricaErrores.TipoError = TipoError;
}

export {FabricaErrores};
//export {TipoError};
