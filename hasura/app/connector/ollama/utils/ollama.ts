import { Ollama } from "ollama";

const CONNECTION_URI = process.env.OLLAMA_CONNECTION_URI;
export const ollama = new Ollama({ host: CONNECTION_URI });
