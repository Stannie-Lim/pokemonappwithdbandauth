import React, { useState, useEffect } from "react";
import axios from "axios";

const User = ({ user, logout }) => {
  const [pokemon, setPokemon] = useState("");

  const [ownedPokemons, setOwnedPokemons] = useState([]);

  useEffect(() => {
    const getData = async () => {
      const response = await axios.get(
        "http://localhost:3000/api/user/my_pokemon",
        {
          headers: {
            authorization: window.localStorage.getItem("token"),
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
      "http://localhost:3000/api/user/catch_pokemon",
      {
        pokemon,
      },
      {
        headers: {
          authorization: window.localStorage.getItem("token"),
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

export default User;
