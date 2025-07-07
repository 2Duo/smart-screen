import React from 'react'

export default function TestApp() {
  console.log('TestApp rendering...')
  
  return (
    <div 
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        fontFamily: 'system-ui'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1>Smart Display - Test Mode</h1>
        <p>If you can see this, React is working</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}