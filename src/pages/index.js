// /pages/index.js
import { useEffect, useState } from 'react'

export default function Home() {
  const [users, setUsers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Load users on first render
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/users')
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  // Add a user
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (!res.ok) throw new Error('Failed to create user')
      const newUser = await res.json()

      // Append new user to the list and clear inputs
      setUsers((prev) => [...prev, newUser])
      setName('')
      setEmail('')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} — {user.email}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'grid', gap: '0.5rem', maxWidth: 400 }}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <button type="submit">Add User</button>
        </div>
      </form>
    </div>
  )
}
