import TcpSocket from 'react-native-tcp-socket';
import { DeviceEventEmitter } from 'react-native';
import { Buffer } from 'buffer';

export class IFConnectV2 {
  constructor() {
    this.port = 10112;
    this.client = null;
    this.connected = false;
    this.running = false;
    
    // Telemetry state
    this.vs = 0.0;
    this.gs = 0.0;
    this.alt = 0.0;
    this.g_force = 1.0;
    this.is_grounded = true;
    this.engines_off = true;
    this.has_crashed = false;
    this.aircraft_id = 'Unknown';
    this.fuel_weight = 0.0;
    this.lat = 0.0;
    this.lon = 0.0;
    this.ias = 0.0;
    this.pitch = 0.0;
    this.bank = 0.0;
    this.agl = 0.0;
    
    // Lights and systems
    this.nav_on = false;
    this.beacon_on = false;
    this.strobe_on = false;
    this.landing_on = false;
    this.no_smoking_on = false;
    this.seatbelt_on = false;
    this.gear_down = true;
    
    // Landing stats
    this.centerline = 0.0;
    this.distance_from_1kft = 0.0;
    
    this.manifest = {};
    this.ids = {};
    
    // Buffer for handling TCP chunks
    this.buffer = Buffer.alloc(0);
    this.state = 'WAIT_HEADER'; // WAIT_HEADER | WAIT_PAYLOAD
    this.expectedLength = 0;
    this.currentCommandId = -1;
  }

  connect(ip) {
    this.serverIp = ip;
    this.running = true;
    
    return new Promise((resolve, reject) => {
      const attemptConnection = () => {
        if (!this.running) {
           reject(new Error('Connection cancelled'));
           return;
        }
        
        console.log(`Connecting to ${ip}:${this.port}...`);
        DeviceEventEmitter.emit('IFC_STATUS', 'Aguardando Simulador...');
        
        this.client = TcpSocket.createConnection(
          { port: this.port, host: ip, timeout: 5000 },
          () => {
            this.connected = true;
            DeviceEventEmitter.emit('IFC_STATUS', 'Conexão bem sucedida!');
            
            if (Object.keys(this.manifest).length === 0) {
              console.log('Connected! Requesting Manifest...');
              this.requestManifest();
            } else {
              console.log('Reconnected for telemetry!');
            }
            resolve(true);
          }
        );

        this.client.on('data', (data) => this.handleData(data));
        
        const scheduleReconnect = (msg) => {
          if (!this.running) return;
          if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
          DeviceEventEmitter.emit('IFC_STATUS', 'Conexão Perdida. Reconectando...');
          console.log(msg);
          this.reconnectTimer = setTimeout(attemptConnection, 3000);
        };

        this.client.on('error', (error) => {
          console.log('Socket Error:', error.message);
          this.connected = false;
          if (this.client) {
             this.client.destroy();
             this.client = null;
          }
          scheduleReconnect('Retrying in 3 seconds...');
        });

        this.client.on('close', () => {
          console.log('Connection closed');
          this.connected = false;
          if (this.client) {
             this.client.destroy();
             this.client = null;
          }
          scheduleReconnect('Connection lost, retrying in 3 seconds...');
        });
      };
      
      attemptConnection();
    });
  }

  disconnect() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
    this.connected = false;
    this.running = false;
  }

  requestManifest() {
    this.sendRequest(-1);
  }

  sendRequest(commandId) {
    if (!this.connected || !this.client) return;
    const header = Buffer.alloc(5);
    header.writeInt32LE(commandId, 0);
    header.writeInt8(0, 4); // GETCMD = 0
    
    const u8 = new Uint8Array(header);
    // console.log(`Sending bytes for cmd ${commandId}:`, u8);
    try {
      this.client.write(u8);
    } catch (e) {
      console.warn('Socket write error:', e);
      this.connected = false;
    }
  }

  readInt32LE(buf, offset = 0) {
    return new DataView(buf.buffer, buf.byteOffset, buf.length).getInt32(offset, true);
  }
  readFloatLE(buf, offset = 0) {
    return new DataView(buf.buffer, buf.byteOffset, buf.length).getFloat32(offset, true);
  }
  readInt8(buf, offset = 0) {
    return new DataView(buf.buffer, buf.byteOffset, buf.length).getInt8(offset);
  }

  handleData(chunk) {
    // console.log(`[TCP] Received chunk of ${chunk.length} bytes.`);
    
    if (this.buffer.length === 0) {
      this.buffer = chunk;
    } else {
      this.buffer = Buffer.concat([this.buffer, chunk]);
    }
    
    while (this.buffer.length > 0) {
      if (this.state === 'WAIT_HEADER') {
        if (this.buffer.length < 8) break; // Not enough for basic header
        
        const tempCommandId = this.readInt32LE(this.buffer, 0);
        
        if (tempCommandId === -1) {
          if (this.buffer.length < 12) break; // Not enough for manifest header
          this.currentCommandId = tempCommandId;
          this.expectedLength = this.readInt32LE(this.buffer, 8);
          console.log(`[TCP] Manifest header read. Command: ${this.currentCommandId}, ExpectedLen: ${this.expectedLength}`);
          this.buffer = this.buffer.subarray(12);
          this.state = 'WAIT_PAYLOAD';
        } else {
          this.currentCommandId = tempCommandId;
          this.expectedLength = this.readInt32LE(this.buffer, 4);
          // console.log(`[TCP] Normal header read. Command: ${this.currentCommandId}, ExpectedLen: ${this.expectedLength}`);
          this.buffer = this.buffer.subarray(8);
          this.state = 'WAIT_PAYLOAD';
        }
      }

      if (this.state === 'WAIT_PAYLOAD') {
        if (this.buffer.length < this.expectedLength) break; // Not enough for payload
        
        // console.log(`[TCP] Full payload received for Command: ${this.currentCommandId}`);
        const payload = this.buffer.subarray(0, this.expectedLength);
        this.buffer = this.buffer.subarray(this.expectedLength);
        this.state = 'WAIT_HEADER';
        
        this.processPayload(this.currentCommandId, payload);
      }
    }
  }

  processPayload(commandId, payload) {
    if (commandId === -1) {
      // Decode Uint8Array to string manually
      let manifestStr = '';
      for (let i = 0; i < payload.length; i++) {
        manifestStr += String.fromCharCode(payload[i]);
      }
      
      const lines = manifestStr.split('\n');
      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 3) {
          this.manifest[parts[2].trim()] = parseInt(parts[0].trim(), 10);
        }
      });
      
      this.mapIds();
      console.log(`Manifest loaded: ${Object.keys(this.manifest).length} items`);
      DeviceEventEmitter.emit('MANIFEST_LOADED');
      
      // Infinite Flight closes the socket after manifest automatically
      // We rely on the natural on('close') event to trigger the reconnection logic.
    } else {
      // It's telemetry data
      this.updateStateFromPayload(commandId, payload);
    }
  }

  mapIds() {
    this.ids = {
      vs: this.manifest['aircraft/0/vertical_speed'],
      gs: this.manifest['aircraft/0/groundspeed'],
      grounded: this.manifest['aircraft/0/is_on_ground'],
      g_force: this.manifest['aircraft/0/g_force_y'],
      engines_off: this.manifest['aircraft/0/systems/engines/are_all_engines_off'],
      alt: this.manifest['aircraft/0/altitude_msl'],
      lat: this.manifest['aircraft/0/latitude'],
      lon: this.manifest['aircraft/0/longitude'],
      ias: this.manifest['aircraft/0/indicated_airspeed'],
      fuel_weight: this.manifest['aircraft/0/systems/fuel/weight'],
      pitch: this.manifest['aircraft/0/pitch'],
      bank: this.manifest['aircraft/0/bank'],
      agl: this.manifest['aircraft/0/altitude_agl'],
      nav: this.manifest['aircraft/0/systems/nav_lights_switch'],
      beacon: this.manifest['aircraft/0/systems/beacon_lights_switch'],
      strobe: this.manifest['aircraft/0/systems/strobe_lights_switch'],
      landing: this.manifest['aircraft/0/systems/landing_lights_switch'],
      no_smoking: this.manifest['aircraft/0/systems/signs/no_smoking'],
      seatbelt: this.manifest['aircraft/0/systems/signs/seatbelt'],
      gear_lever: this.manifest['aircraft/0/systems/landing_gear/lever_state'],
      crash: this.manifest['aircraft/0/has_crashed'],
      centerline: this.manifest['simulator/statistics/last_landing/distance_from_centerline'],
      distance_from_1kft: this.manifest['simulator/statistics/last_landing/distance_from_1kft_marker'],
    };
    console.log('Mapped IDs:', this.ids);
  }

  updateStateFromPayload(commandId, payload) {
    try {
      if (commandId === this.ids.vs && payload.length >= 4) {
        this.vs = this.readFloatLE(payload, 0) * 196.85; // m/s to fpm
      } else if (commandId === this.ids.gs && payload.length >= 4) {
        this.gs = this.readFloatLE(payload, 0) * 1.94384; // m/s to knots
      } else if (commandId === this.ids.alt && payload.length >= 4) {
        this.alt = this.readFloatLE(payload, 0); // already in feet
      } else if (commandId === this.ids.g_force && payload.length >= 4) {
        this.g_force = Math.abs(this.readFloatLE(payload, 0));
      } else if (commandId === this.ids.lat && payload.length >= 4) {
        this.lat = this.readFloatLE(payload, 0);
      } else if (commandId === this.ids.lon && payload.length >= 4) {
        this.lon = this.readFloatLE(payload, 0);
      } else if (commandId === this.ids.ias && payload.length >= 4) {
        this.ias = this.readFloatLE(payload, 0) * 1.94384; // m/s to knots
      } else if (commandId === this.ids.pitch && payload.length >= 4) {
        this.pitch = this.readFloatLE(payload, 0);
      } else if (commandId === this.ids.bank && payload.length >= 4) {
        this.bank = this.readFloatLE(payload, 0);
      } else if (commandId === this.ids.agl && payload.length >= 4) {
        this.agl = this.readFloatLE(payload, 0) * 3.28084; // meters to feet (assume agl needs conversion if msl didn't? wait, msl didn't. let's just leave agl raw or check later. Actually I will leave it raw for now to match python)
        this.agl = this.readFloatLE(payload, 0);
      } else if (commandId === this.ids.fuel_weight && payload.length >= 4) {
        this.fuel_weight = this.readFloatLE(payload, 0);
      } else if (commandId === this.ids.centerline && payload.length >= 4) {
        this.centerline = this.readFloatLE(payload, 0);
      } else if (commandId === this.ids.distance_from_1kft && payload.length >= 4) {
        this.distance_from_1kft = this.readFloatLE(payload, 0);
        
      // Booleans (Int32)
      } else if (commandId === this.ids.grounded && payload.length >= 4) {
        this.is_grounded = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.engines_off && payload.length >= 4) {
        this.engines_off = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.nav && payload.length >= 4) {
        this.nav_on = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.beacon && payload.length >= 4) {
        this.beacon_on = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.strobe && payload.length >= 4) {
        this.strobe_on = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.landing && payload.length >= 4) {
        this.landing_on = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.no_smoking && payload.length >= 4) {
        this.no_smoking_on = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.seatbelt && payload.length >= 4) {
        this.seatbelt_on = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.crash && payload.length >= 4) {
        this.has_crashed = this.readInt32LE(payload, 0) !== 0;
      } else if (commandId === this.ids.gear_lever && payload.length >= 4) {
        this.gear_down = this.readInt32LE(payload, 0) !== 0;
      }
      
      // Emit event for UI to update (we send the entire state)
      DeviceEventEmitter.emit('TELEMETRY_UPDATE', this);
    } catch (e) {
      console.warn('Payload parsing error', e);
    }
  }

  pollTelemetry() {
    if (!this.connected) {
      console.log('pollTelemetry skipped: not connected');
      return;
    }
    
    const validIds = Object.values(this.ids).filter(id => id !== undefined);
    if (validIds.length === 0) return;
    
    // We must send requests one by one with a small delay so we don't flood IF Connect
    let index = 0;
    const sendNext = () => {
      if (!this.connected || index >= validIds.length) return;
      this.sendRequest(validIds[index]);
      index++;
      setTimeout(sendNext, 20); // 20ms delay between each variable request
    };
    sendNext();
  }
}
