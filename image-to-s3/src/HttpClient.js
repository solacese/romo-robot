/**
 * HttpClient.js
 * Wrapper around axios (https://github.com/axios/axios)
 * @author Andrew Roberts
 */

import axios from "axios";

export async function makeRequest({
  baseUrl,
  basicAuthUsername,
  basicAuthPassword,
  body,
  endpoint,
  headers,
  method,
  queryString
}) {
  // form url
  let url = `${baseUrl}${endpoint}`;
  if (queryString) {
    url = `${url}${queryString}`;
  }
  // form axios config obj
  const config = {
    method: method,
    url: url
  };
  if (basicAuthUsername && basicAuthPassword) {
    config["auth"] = {
      username: basicAuthUsername,
      password: basicAuthPassword
    };
  }
  if (headers) {
    config["headers"] = headers;
  }
  if(body) {
    config["data"] = body;
  }
  // make call
  try {
    //console.log(config);
    let res = await axios(config);
    return res;
  } catch (err) {
    throw new Error(err);
  }
}