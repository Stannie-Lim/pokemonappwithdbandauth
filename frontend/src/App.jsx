import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import axios from "axios";

import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

import AuthForm from "./AuthForm";
import User from "./User";

import UserContext from "./UserContext";

function App() {
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const possiblyLogin = async () => {
      const token = window.localStorage.getItem("token");

      if (token) {
        const userResponse = await axios.get(
          "http://localhost:3000/api/auth/me",
          {
            headers: {
              authorization: token,
            },
          }
        );

        const user = userResponse.data;

        setUser(user);

        navigate("/homepage");
      }
    };

    possiblyLogin();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          username,
          password,
        }
      );

      const token = response.data;

      window.localStorage.setItem("token", token);

      const userResponse = await axios.get(
        "http://localhost:3000/api/auth/me",
        {
          headers: {
            authorization: token,
          },
        }
      );

      const user = userResponse.data;

      setUser(user);

      navigate("/homepage");
    } catch (error) {
      console.log(error);
    }
  };

  const register = async (username, password) => {
    try {
      // we're trying to register a user
      // why are we using axios post?

      const response = await axios.post(
        "http://localhost:3000/api/auth/register",
        {
          username,
          password,
        }
      );

      const token = response.data;

      window.localStorage.setItem("token", token);

      const userResponse = await axios.get(
        "http://localhost:3000/api/auth/me",
        {
          headers: {
            authorization: token,
          },
        }
      );

      const user = userResponse.data;

      setUser(user);

      navigate("/homepage");
    } catch (e) {
      console.log(e);
    }
  };

  const logout = () => {
    window.localStorage.removeItem("token");

    setUser(null);

    navigate("/login");
  };

  return (
    <>
      <UserContext.Provider value={user}>
        <Routes>
          {user ? (
            <Route path="/homepage" element={<User logout={logout} />} />
          ) : (
            <>
              <Route
                path="/login"
                element={<AuthForm onAuthFormSubmit={login} />}
              />
              <Route
                path="/register"
                element={<AuthForm onAuthFormSubmit={register} />}
              />
            </>
          )}
        </Routes>
      </UserContext.Provider>
    </>
  );
}

export default App;
