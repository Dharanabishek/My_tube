"use client";

import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:5000";
const rawAxios = axios.create({ baseURL, timeout: 10000 });

function parseJwtExpiry(token) {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (json && json.exp) return json.exp * 1000;
  } catch (e) {}
  return Date.now() + 7 * 24 * 3600 * 1000;
}

async function requestTokenFromServer(userId) {
  try {
    const resp = await rawAxios.post('/user/token', { userId });
    return resp.data?.token;
  } catch (err) {
    console.error('requestTokenFromServer error', err);
    return null;
  }
}

export async function getAuthToken() {
  try {
    let token = localStorage.getItem('auth_token');
    let exp = Number(localStorage.getItem('auth_token_exp') || '0');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!token || !exp || exp < Date.now()) {
      if (!user) return null;
      token = await requestTokenFromServer(user._id);
      if (!token) return null;
      exp = parseJwtExpiry(token);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_token_exp', String(exp));
    }
    return token;
  } catch (err) {
    console.error('getAuthToken error', err);
    return null;
  }
}
