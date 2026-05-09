'use client'

import { useState, useEffect } from 'react'
import { testSupabaseConnection, insertInterview, getInterviews } from '@/lib/supabase-db'

export default function TestPage() {
  const [status, setStatus] = useState<string>('Checking connection...')
  const [results, setResults] = useState<any[]>([])
  const [inserting, setInserting] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    setStatus('Testing Supabase connection...')
    const result = await testSupabaseConnection()
    if (result.connected) {
      setStatus('✅ Connected to Supabase successfully!')
      // Fetch existing interviews
      const interviews = await getInterviews()
      setResults(interviews.data)
    } else {
      setStatus(`❌ Connection failed: ${result.error}`)
    }
  }

  async function insertTestData() {
    setInserting(true)
    const result = await insertInterview({
      user_name: 'Test User',
      role: 'Frontend Engineer',
      score: 85,
      feedback: 'good',
    })

    if (result.success) {
      setStatus('✅ Test data inserted successfully!')
      // Refresh list
      const interviews = await getInterviews()
      setResults(interviews.data)
    } else {
      setStatus(`❌ Insert failed: ${result.error}`)
    }
    setInserting(false)
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', color: '#fff', background: '#0a0a0a', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#6366f1' }}>🔌 Supabase Connection Tester</h1>
      
      <div style={{ padding: '16px', background: '#1a1a2e', borderRadius: '12px', marginBottom: '20px', border: '1px solid #333' }}>
        <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Status: {status}</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button 
          onClick={checkConnection}
          style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
        >
          🔄 Re-test Connection
        </button>
        <button 
          onClick={insertTestData}
          disabled={inserting}
          style={{ padding: '12px 24px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', opacity: inserting ? 0.5 : 1 }}
        >
          {inserting ? '⏳ Inserting...' : '➕ Insert Test Data'}
        </button>
      </div>

      <h2 style={{ fontSize: '18px', marginBottom: '12px', color: '#a78bfa' }}>📊 Interviews in Supabase ({results.length} rows)</h2>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333' }}>
              <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>ID</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>User</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Score</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Feedback</th>
              <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No data yet. Click "Insert Test Data" to add a row.
                </td>
              </tr>
            ) : (
              results.map((row: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px', color: '#666' }}>{row.id?.slice(0, 8)}...</td>
                  <td style={{ padding: '10px' }}>{row.user_name}</td>
                  <td style={{ padding: '10px' }}>{row.role}</td>
                  <td style={{ padding: '10px', color: row.score >= 70 ? '#10b981' : '#f59e0b' }}>{row.score}</td>
                  <td style={{ padding: '10px' }}>{row.feedback}</td>
                  <td style={{ padding: '10px', color: '#888' }}>{new Date(row.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}