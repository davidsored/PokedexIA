import axios from "axios";

/**
 * Cliente HTTP base para la PokeAPI.
 */
const api = axios.create({
  baseURL: "https://pokeapi.co/api/v2/",
  timeout: 10000,
});

export default api;
