import { gql } from '@apollo/client';

const MUTATION_CREAR_CONVERSACION = gql`
mutation CrearNuevaConversacion($conversacionCreateInput: ConversacionCreateInput!) {
    crearNuevaConversacion(conversacionCreateInput: $conversacionCreateInput) {
      id
      fecha_hora_inicio_conversacion
      fases_interaccion {
        id
        secuencia_en_conversacion
        fase_conversacion {
          nombre_fase
          id
        }
      }
      ultima_fase_conversacion {
        id
        nombre_fase
        mensaje_de_fase
      }
    }
}
`;


const MUTATION_CONTINUAR_CONVERSACION = gql`
mutation ContinuarConversacion($conversacionUpdateInput: ConversacionUpdateInput!) {
    continuarConversacion(conversacionUpdateInput: $conversacionUpdateInput) {
      ultima_fase_conversacion {
        mensaje_de_fase
      },
      tokenJWTUsuarioAutenticado,
    }
}
`;
  

export const clientGraphQLMutations = {
    MUTATION_CREAR_CONVERSACION: MUTATION_CREAR_CONVERSACION,
    MUTATION_CONTINUAR_CONVERSACION: MUTATION_CONTINUAR_CONVERSACION,
}
