"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    role: "customer",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")
    setSuccess("")

    if (formData.password.length < 8) {
        setError("Password must be at least 8 characters")
        return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        "https://pharmify-jugv.onrender.com/api/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            phone: formData.phone,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (data.username) {
          throw new Error(data.username[0])
        }

        if (data.email) {
          throw new Error(data.email[0])
        }

        if (data.password) {
          throw new Error(data.password[0])
        }

        throw new Error("Registration failed")
      }

      localStorage.setItem("access", data.access)
      localStorage.setItem("refresh", data.refresh)

      setSuccess("Account created successfully")

      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">
          Create Account
        </h1>

        <p className="auth-subtitle">
          Join Pharmify today
        </p>

        {error && (
          <p className="error-text">
            {error}
          </p>
        )}

        {success && (
          <p className="success-text">
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            className="auth-input"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="auth-input"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            className="auth-input"
            value={formData.phone}
            onChange={handleChange}
          />

          <select
            name="role"
            className="role-select"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="customer">
              Customer
            </option>

            <option value="owner">
              Pharmacy Owner
            </option>
          </select>

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="auth-input"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            className="auth-input"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Register"}
          </button>
        </form>

        <button className="auth-button google-btn">
          Continue with Google
        </button>
      </div>
    </div>
  )
}