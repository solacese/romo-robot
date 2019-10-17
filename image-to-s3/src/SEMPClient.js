/**
 * SEMPClient
 * Initializes a SEMP client for the provided msgVpn
 * If you need to perform operations across msgVpns, initialize multiple clients
 * @author Andrew Roberts
 */

import { makeRequest } from "./HttpClient";

function SEMPClient(msgVpn) {
  const baseUrl = `${process.env.SEMP_ENDPOINT}/msgVpns/${msgVpn}`;
  const client = {};

  /**
   * provisionQueue
   * Creates or replaces a queue using the provided queueName
   */
  client.provisionQueue = async function createQueue(queueName) {
    const requestParams = {
      baseUrl: baseUrl,
      basicAuthUsername: process.env.SEMP_USERNAME,
      basicAuthPassword: process.env.SEMP_PASSWORD,
      body: {
        egressEnabled: true,
        ingressEnabled: true,
        permission: "consume",
        queueName: queueName
      },
      endpoint: `/queues/${encodeURIComponent(queueName)}`,
      method: "PUT"
    };
    try {
      console.log(`Provisioning queue "${queueName}"...`);
      let res = await makeRequest(requestParams);
      console.log(`Successfully provisioned queue "${queueName}".`);
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };

  /**
   * provisionQueueSubscription
   * Creates a queue subscription using the provided queueName and subscriptionTopic
   */
  client.provisionQueueSubscription = async function createQueue(
    queueName,
    subscriptionTopic
  ) {
    // first, make a GET request to see if the subscription already exists
    const getRequestParams = {
      baseUrl: baseUrl,
      basicAuthUsername: process.env.SEMP_USERNAME,
      basicAuthPassword: process.env.SEMP_PASSWORD,
      endpoint: `/queues/${encodeURIComponent(queueName)}/subscriptions/${encodeURIComponent(subscriptionTopic)}`,
      method: "GET"
    };
    try {
      console.log(`Adding queue subscription "${subscriptionTopic}" to queue "${queueName}"...`);
      let res = await makeRequest(getRequestParams);
      console.log(`Queue subscription "${subscriptionTopic}" already exists on queue "${queueName}".`);  
      return true;
    } catch {
      // if the queue subscription does not exist, provision it
      const postRequestParams = {
        baseUrl: baseUrl,
        basicAuthUsername: process.env.SEMP_USERNAME,
        basicAuthPassword: process.env.SEMP_PASSWORD,
        body: {
          subscriptionTopic: subscriptionTopic
        },
        endpoint: `/queues/${encodeURIComponent(queueName)}/subscriptions`,
        method: "POST"
      };
      try {
        let res = await makeRequest(postRequestParams);
        console.log(`Successfully added queue subscription "${subscriptionTopic}" to queue "${queueName}".`);  
        return true;
      } catch (err) {
        throw new Error(err);
      }
    }
  };
  return client;
}

export default SEMPClient;
