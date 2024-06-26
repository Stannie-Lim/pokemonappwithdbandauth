import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import axios from "axios";

import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

const AuthForm = ({ onAuthFormSubmit }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const location = useLocation();

  // if im on /login, that means it'll be a login form
  // if im on /register, that means it'll be a register form

  const onSubmit = (event) => {
    event.preventDefault();

    onAuthFormSubmit(username, password);
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        placeholder="Username"
        value={username}
        onChange={(ev) => setUsername(ev.target.value)}
      />
      <input
        placeholder="Password"
        value={password}
        onChange={(ev) => setPassword(ev.target.value)}
      />
      <button>{location.pathname === "/login" ? "Login" : "Register"}</button>
    </form>
  );
};

const User = ({ user, logout }) => {
  const [pokemon, setPokemon] = useState("");

  const [ownedPokemons, setOwnedPokemons] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/my_pokemon`,
        {
          headers: {
            authorization: window.localStorage.getItem("auth_token"),
          },
        }
      );

      const ownedPokemon = response.data;

      setOwnedPokemons(ownedPokemon);
    };

    getData();
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();

    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/user/catch_pokemon`,
      {
        pokemon,
      },
      {
        headers: {
          authorization: window.localStorage.getItem("auth_token"),
        },
      }
    );

    const ownedPokemon = response.data;

    setOwnedPokemons(ownedPokemon);
  };

  return (
    <>
      <button onClick={logout}>Log out</button>
      <h6>
        You are logged in as {user.username}. Your hashed password is{" "}
        {user.password}
      </h6>
      <form onSubmit={onSubmit}>
        <input
          placeholder="Catch a pokemon"
          value={pokemon}
          onChange={(ev) => setPokemon(ev.target.value)}
        />
        <button>Catch em all</button>
      </form>
      <ul>
        {ownedPokemons.map((pokemon) => (
          <li key={pokemon.id}>{pokemon.name}</li>
        ))}
      </ul>
    </>
  );
};

function App() {
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const possiblyLogin = async () => {
      const token = window.localStorage.getItem("auth_token");

      if (token) {
        const userResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/auth/me`,
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
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          username,
          password,
        }
      );

      const token = response.data;

      window.localStorage.setItem("auth_token", token);

      const userResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/me`,
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
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        {
          username,
          password,
        }
      );

      const token = response.data;

      window.localStorage.setItem("auth_token", token);

      const userResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/me`,
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
    window.localStorage.removeItem("auth_token");

    setUser(null);

    navigate("/login");
  };

  return (
    <>
      <Routes>
        {user ? (
          <Route
            path="/homepage"
            element={<User user={user} logout={logout} />}
          />
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
    </>
  );
}

export default App;
