import { gql } from '@apollo/client';


const QUERY_EMPRESA = gql`
        query Empresa($empresaId: ID!) {
            empresa(id: $empresaId) {
                nombre_empresa
            }
        }        
        `;

const QUERY_GET_PUBLIC_TOKEN = gql`
        query getTokenAccesoPublico {
            getTokenAccesoPublico {
                tokenJWT
            }
        }        
        `;

export const clientGraphQLQueries = {
    QUERY_EMPRESA: QUERY_EMPRESA,
    QUERY_GET_PUBLIC_TOKEN: QUERY_GET_PUBLIC_TOKEN,
}
