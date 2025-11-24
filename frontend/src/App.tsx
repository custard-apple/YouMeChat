import { useState } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home'
import Call from './pages/Call'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/call/:roomId" element={<Call />}/>
    </Routes>
  )
}

export default App
