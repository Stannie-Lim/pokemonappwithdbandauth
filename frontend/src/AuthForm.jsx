import React, { useState } from "react";
import { useLocation } from "react-router-dom";

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

export default AuthForm;
