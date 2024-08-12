import { GraphQLScalarType, Kind } from 'graphql';

const dateScalar = new GraphQLScalarType({
  name: 'miTimestamp',
  description: 'Tipo Timestamp adaptado',

  serialize(value) {
    if (value instanceof Date) {
      console.log('recibi un tipo Date en serialize ...');
      //const fechaFormateada = value.toDateString('es-es', { year:"numeric", month:"short", day:"numeric"});
      const fechaFormateada = value.toDateString('es-es');
      console.log('la fecha formateada es: '+fechaFormateada);
      return fechaFormateada;

      //return value.getTime(); // Convert outgoing Date to integer for JSON
    } 

    console.log('recibi un tipo distinto de Date en serialize ...');
    if (value) return new String(value);

    throw Error('Serializador de GraphQL para el escalar Date esperaba un objeto `Date`');
  },
  
  parseValue(value) {
    if (typeof value === 'number') {
      console.log('devolvere un tipo Date en parseValue ...');
      return new Date(value); // Convert incoming integer to Date
    }
    console.log('recibi un tipo distinto de number en parseValue ...');
    throw new Error('Formateador de GraphQL para el escalar Date esperaba un `number`');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT) {
      // Convert hard-coded AST string to integer and then to Date
      console.log('recibi un tipo Date en parseLiteral ...');
      return new Date(parseInt(ast.value, 10));
    }
    // Invalid hard-coded value (not an integer)
    console.log('recibi un tipo distinto de Kind.INT en parseLiteral ...');
    return null;
  },
});

export {dateScalar};