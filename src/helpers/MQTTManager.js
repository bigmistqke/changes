// import MQTT from 'sp-react-native-mqtt';
import init from 'react_native_mqtt';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { connection } from 'mongoose';

function MQTTManager() {
  let client;
  let subscriptions = {};

  let connection_data = {};
  let offline_messages = [];

  init({
    size: 10000,
    storageBackend: AsyncStorage,
    defaultExpires: 1000 * 3600 * 24,
    enableCache: true,
    reconnect: true,
    keepAliveInterval: 10,
    reconnect: true,
    sync: {
    }
  });

  this.isConnected = false;

  this.reconnect = async () => {
    if (!connection_data) return;
    if (this.isConnected || !client || client.isConnected()) return;
    let result = await this.connect(connection_data);
    if (!result) {
      setTimeout(() => this.reconnect(), 1000);
      return;
    }
    offline_messages.forEach(({ topic, data }) => this.send(topic, data));
  }

  this.disconnect = () => {
    if (!client || !client.isConnected()) return;
    client.disconnect()
  }

  this.connect = ({ protocol = "ws", url, port = 1883 }) => new Promise(async (resolve, reject) => {

    connection_data = { protocol, url, port };

    client = new Paho.MQTT.Client(url, port, uuid.v4());
    client.onConnectionLost = responseObject => {
      if (responseObject.errorCode !== 0) {
        this.isConnected = false;
        // this.reconnect();
      }
    };

    client.onMessageArrived = ({ topic, payloadString: data }) => {
      try {
        data = JSON.parse(data);
      } catch (error) { }
      subscriptions[topic](data)
    };

    client.disconnectedPublishing = true;
    client.connect({
      onSuccess: () => {
        console.log('connected');
        this.isConnected = true;
        Object.keys(subscriptions).forEach(topic => client.subscribe(topic));
        resolve(true);
      },
      onFailure: (err) => {

        this.isConnected = false;
        resolve(false)
      },
      reconnect: true,
      keepAliveInterval: 10,
      useSSL: true
    });
  })


  this.send = (topic, data) => {
    if (typeof data !== "string") {
      data = JSON.stringify(data);
    }
    if (client && !client.isConnected()) {

      if (offline_messages.find(om => om.topic === topic && om.data === data))
        return;

      offline_messages.push({ topic, data });
      return;
    }

    client.publish(topic, data);
  }

  this.subscribe = (topic, callback) => {
    client.subscribe(topic);
    subscriptions[topic] = callback;
  }

  this.unsubscribe = (topic) => {
    client.unsubscribe(topic);
    delete subscriptions[topic];
  }
}

export default MQTTManager
