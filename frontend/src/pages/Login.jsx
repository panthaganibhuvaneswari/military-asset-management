import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, User } from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }

    const result = await login(username, password);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-icon">
          <Shield size={42} />
        </div>

        <h1>Military Asset Management</h1>

        <p className="login-subtitle">
          Secure Asset Management System
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>Username</label>

            <div className="input-wrapper">
              <User size={18} />

              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>

            <div className="input-wrapper">
              <Lock size={18} />

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

        </form>

        <p className="login-footer">
          Military Asset Management System
        </p>

      </div>
    </div>
  );
}

export default Login;