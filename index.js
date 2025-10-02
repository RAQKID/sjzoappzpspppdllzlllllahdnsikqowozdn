const express = require("express");
const axios = require("axios");
const { createServer } = require("http");
const { parse } = require("url");
require("dotenv").config();

const app = express();
app.set("json spaces", 2);

const API_KEY = process.env.API_KEY;
const API_KEY2 = process.env.API_KEY2;
const API_KEY3 = process.env.API_KEY3;

// ---------------- OpenRouter ----------------
async function askOpenRouter(model, prompt) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    { model, messages: [{ role: "user", content: prompt }] },
    { headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" } }
  );
  return response.data.choices[0].message.content;
}

// ---------------- Cerebras (Qwen) ----------------
async function askCerebras(model, prompt) {
  const response = await axios.post(
    "https://api.cerebras.ai/v1/chat/completions",
    {
      model,
      messages: [{ role: "user", content: prompt }],
      max_completion_tokens: 8192,
      temperature: 0.7,
      top_p: 0.8,
    },
    { headers: { Authorization: `Bearer ${API_KEY2}`, "Content-Type": "application/json" } }
  );
  return response.data.choices[0].message.content;
}

// ---------------- AIML (Gemma) ----------------
async function askAIML(model, prompt) {
  const response = await axios.post(
    "https://api.aimlapi.com/v1/chat/completions",
    {
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 1.9,
      top_p: 1,
      frequency_penalty: 1.9,
      max_tokens: 1536,
      top_k: 100,
    },
    { headers: { Authorization: `Bearer ${API_KEY3}`, "Content-Type": "application/json" } }
  );
  return response.data.choices[0].message.content;
}

// ---------------- Routes ----------------
app.get("/", (req, res) => res.send("Server is running!"));

app.get("/deepseek", async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "Prompt is required" });
  try {
    const reply = await askOpenRouter("deepseek/deepseek-chat-v3.1:free", prompt);
    res.json({ status: true, result: [{ response: reply }] });
  } catch (err) {
    console.error("DeepSeek Error:", err.response?.data || err.message);
    res.status(500).json({ status: false, error: "DeepSeek request failed" });
  }
});

app.get("/nemotron", async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "Prompt is required" });
  try {
    const reply = await askOpenRouter("nvidia/nemotron-nano-9b-v2:free", prompt);
    res.json({ status: true, result: [{ response: reply }] });
  } catch (err) {
    console.error("Nemotron Error:", err.response?.data || err.message);
    res.status(500).json({ status: false, error: "Nemotron request failed" });
  }
});

app.get("/qwen", async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "Prompt is required" });
  try {
    const reply = await askCerebras("qwen-3-235b-a22b-instruct-2507", prompt);
    res.json({ status: true, result: [{ response: reply }] });
  } catch (err) {
    console.error("Qwen Error:", err.response?.data || err.message);
    res.status(500).json({ status: false, error: "Qwen request failed" });
  }
});

app.get("/gemma", async (req, res) => {
  const { prompt } = req.query;
  if (!prompt) return res.status(400).json({ status: false, error: "Prompt is required" });
  try {
    const reply = await askAIML("google/gemma-3-4b-it", prompt);
    res.json({ status: true, result: [{ response: reply }] });
  } catch (err) {
    console.error("Gemma Error:", err.response?.data || err.message);
    res.status(500).json({ status: false, error: "Gemma request failed" });
  }
});

// ---------------- Vercel Handler ----------------
module.exports = (req, res) => {
  const parsedUrl = parse(req.url, true);
  app(req, res, parsedUrl);
};
