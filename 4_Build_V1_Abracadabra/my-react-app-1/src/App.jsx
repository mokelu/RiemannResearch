import { useState, useEffect } from 'react'
import { IronCalc, init, Model } from '@ironcalc/workbook'
import './style.css'

function App() {
  const [model, setModel] = useState(null)

  useEffect(() => {
    init().then(() => {
      setModel(new Model('my-spreadsheet', 'en', 'UTC', 'en'))
    })
  }, [])

  if (!model) return <div>Loading...</div>

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <IronCalc model={model} />
    </div>
  )
}

export default App
