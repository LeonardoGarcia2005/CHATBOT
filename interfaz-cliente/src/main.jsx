import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ApolloClient, InMemoryCache, ApolloProvider, gql, createHttpLink, ApolloLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { AuthProvider } from "./context/AuthContext";

const httpLink = createHttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',
});

const sessionLink = new ApolloLink((operation, forward) => {
  return forward(operation).map(response => {
    console.log('response es: '+JSON.stringify(response));
    if (response.headers) {
      console.log('obtuve el headers del response ...');
      if (response.headers.sessionID){
        console.log('obtuve el sessionID del headers: '+response.headers.sessionID);
        localStorage.setItem('sessionID',response.headers.sessionID);
      }
    }
    else console.log('NO obtuve el headers del response ...');
    return response;
  });
});

// Configuro el middleware para añadir los headers personalizados, como el sessionID
const authLink = setContext((_, { headers }) => {
  // Aquí puedes obtener el sessionID de tu sistema de autenticación
  //const sessionID = localStorage.getItem('sessionID');
  const token = localStorage.getItem('token');

  // Devuelvo los headers con el sessionID añadido
  //console.log('Voy a retornar el header con sessionID: '+sessionID);
  console.log('Voy a retornar el header con token: '+token);
  return {
    headers: {
      ...headers,
      //sessionID: sessionID,
      authorization: token ? token : '',
    }
  };
});


const client = new ApolloClient({
  //uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache(),
  link: from([
    authLink,
    //sessionLink,
    httpLink
  ]),    //authLink.concat(httpLink),
  //credentials: 'include',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ApolloProvider client={client}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ApolloProvider>,
)
