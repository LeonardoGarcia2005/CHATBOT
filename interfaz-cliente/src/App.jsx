import { useState } from 'react'
import './App.css'
import ChatConversacion from './components/ChatConversacion';


function App() {

  return (
    <div style={{backgroundColor: "blueviolet", height:"100vh", display:"flex", justifyContent:"center", alignItems:"center", 
    flexDirection:"column"}}>
      <h1 style={{color:"#fff", fontSize:"50px", marginBottom: "20px"}}>Chatgea</h1>
      <div className="app">
        <ChatConversacion />
      </div>
    </div>
  )
}

export default App
