import { DeviceEventEmitter } from 'react-native';

export class FlightTracker {
  constructor(ifConnect) {
    this.ifc = ifConnect;
    
    this.events = [];
    this.light_infractions = [];
    this.ias_violation_count = 0;
    this.unstable_appr_count = 0;
    
    this.peak_g_force = 1.0;
    this.bounce_count = 0;
    this.flight_reported = false;
    
    this.has_passed_10k = false;
    this.prev_alt = 0.0;
    this.climb_10k_grace_start = 0.0;
    this.descent_10k_grace_start = 0.0;
    
    this.takeoff_time = 0.0;
    this.takeoff_fuel = 0.0;
    
    this.landing_lat = 0.0;
    this.landing_lon = 0.0;
    this.landing_fuel = 0.0;
    
    this.last_report = {
      rate_fpm: 0,
      g_force: 1.0,
      centerline: 0.0,
      distance_from_1kft: 0.0,
      status: "WAITING",
      score: null,
      deductions: []
    };
    
    this.status = "TAXI"; // TAXI, TAKEOFF, CLIMB, CRUISE, DESCENT, APPROACH, LANDING, FINISHED
    
    // Subscribe to telemetry updates
    this.sub = DeviceEventEmitter.addListener('TELEMETRY_UPDATE', this.onTelemetryUpdate.bind(this));
  }

  addEvent(msg, color = "white") {
    if (this.events.length === 0 || this.events[this.events.length - 1].msg !== msg) {
      this.events.push({ msg, color, time: Date.now() });
      if (this.events.length > 15) this.events.shift();
      console.log(`[FLIGHT EVENT] ${msg}`);
      DeviceEventEmitter.emit('FLIGHT_EVENT', { msg, color });
    }
  }

  addLightInfraction(msg) {
    if (!this.light_infractions.includes(msg)) {
      this.light_infractions.push(msg);
      this.addEvent(`INFRAÇÃO: ${msg}`, "red");
    }
  }

  onTelemetryUpdate(state) {
    if (state.has_crashed) {
      this.last_report.status = "CRASHED";
      if (!this.flight_reported) this.finalizeFlight();
      return;
    }
    
    if (state.engines_off && state.is_grounded && this.status !== "TAXI") {
      if (this.status === "LANDING" && !this.flight_reported) {
         this.status = "FINISHED";
         this.finalizeFlight();
      }
      return;
    }

    // Tracking Peak G
    if (!state.is_grounded && state.g_force > this.peak_g_force) {
      this.peak_g_force = state.g_force;
    }

    this.checkPhases(state);
    this.checkInfractions(state);
    
    this.prev_alt = state.alt;
  }

  checkPhases(state) {
    // Basic phase detection simplified for RN version
    if (state.is_grounded && state.gs < 30) {
       if (this.status === "APPROACH" || this.status === "DESCENT") {
         this.status = "LANDING";
         this.last_report.status = "LANDED";
         this.last_report.rate_fpm = state.vs;
         this.last_report.g_force = this.peak_g_force;
         this.last_report.centerline = state.centerline;
         this.last_report.distance_from_1kft = state.distance_from_1kft;
         this.landing_fuel = state.fuel_weight;
         this.landing_lat = state.lat;
         this.landing_lon = state.lon;
         this.addEvent("Toque na pista registrado!", "green");
       } else if (this.status !== "LANDING" && this.status !== "FINISHED") {
         this.status = "TAXI";
       }
    } else if (state.is_grounded && state.gs >= 30 && this.status === "TAXI") {
       this.status = "TAKEOFF";
       this.takeoff_fuel = state.fuel_weight;
       this.takeoff_time = Date.now();
       this.addEvent("Iniciando decolagem", "blue");
    } else if (!state.is_grounded) {
       if (state.vs > 500) {
         this.status = state.alt < 10000 ? "CLIMB" : "CRUISE";
       } else if (state.vs < -500) {
         this.status = state.alt < 5000 ? "APPROACH" : "DESCENT";
       } else {
         this.status = "CRUISE";
       }
    }
  }

  checkInfractions(state) {
    const now = Date.now();
    
    // 10k ft crossing
    if (this.prev_alt > 0.1 && !state.is_grounded) {
      if (this.prev_alt < 10000 && state.alt >= 10000) {
        this.climb_10k_grace_start = now;
        this.descent_10k_grace_start = 0;
        this.addEvent("Cruzando 10,000ft (Subida)", "blue");
      }
      if (this.prev_alt > 10000 && state.alt <= 10000) {
        this.descent_10k_grace_start = now;
        this.climb_10k_grace_start = 0;
        this.addEvent("Cruzando 10,000ft (Descida)", "blue");
      }
    }

    if (state.alt > 10000) this.has_passed_10k = true;

    // Lights
    if (state.gs > 2 && !state.nav_on) this.addLightInfraction("NAV lights off in motion");
    if (!state.engines_off && !state.beacon_on) this.addLightInfraction("BEACON lights off with engines running");
    if (!state.is_grounded && !state.strobe_on) this.addLightInfraction("STROBE lights off in flight");

    if (state.alt > 10000 && state.landing_on) {
      const grace = this.climb_10k_grace_start > 0 && (now - this.climb_10k_grace_start <= 60000);
      if (!grace) this.addLightInfraction("Landing lights on above 10,000ft");
    }
    
    if (!state.is_grounded && state.alt < 10000 && !state.landing_on && this.has_passed_10k) {
      const grace = this.descent_10k_grace_start > 0 && (now - this.descent_10k_grace_start <= 60000);
      if (!grace) this.addLightInfraction("Landing lights off below 10,000ft");
    }

    // Speed violation (IAS > 250kts under 10k)
    if (!state.is_grounded && state.alt < 10000 && state.ias > 260) { // 10kts margin
      if (!this._ias_viol_active) {
         this.ias_violation_count++;
         this._ias_viol_active = true;
         this.addEvent("Aviso: Velocidade acima de 250kts abaixo de 10,000ft", "red");
      }
    } else {
      this._ias_viol_active = false;
    }
  }

  calculateScore() {
    if (this.last_report.status === "CRASHED") {
      return { score: 0.0, deductions: [{ reason: "AIRCRAFT CRASHED", penalty: -10.0 }] };
    }
    
    let score = 10.0;
    const deductions = [];
    
    const g = this.last_report.g_force;
    if (g > 3.00) { score -= 10; deductions.push({ reason: `Excessive G-force landing (${g.toFixed(2)}G)`, penalty: -10 }); }
    else if (g > 2.00) { score -= 6; deductions.push({ reason: `Very hard landing (${g.toFixed(2)}G)`, penalty: -6 }); }
    else if (g > 1.50) { score -= 3; deductions.push({ reason: `Hard landing (${g.toFixed(2)}G)`, penalty: -3 }); }
    else if (g > 1.20) { score -= 1; deductions.push({ reason: `Firm landing (${g.toFixed(2)}G)`, penalty: -1 }); }
    
    const vs = Math.abs(this.last_report.rate_fpm);
    if (vs > 1000) { score -= 10; deductions.push({ reason: `Extremely hard landing (${Math.round(vs)} FPM)`, penalty: -10 }); }
    else if (vs > 600) { score -= 6; deductions.push({ reason: `Hard landing (${Math.round(vs)} FPM)`, penalty: -6 }); }
    else if (vs > 400) { score -= 3; deductions.push({ reason: `Firm landing (${Math.round(vs)} FPM)`, penalty: -3 }); }
    else if (vs > 200) { score -= 1; deductions.push({ reason: `Normal landing (${Math.round(vs)} FPM)`, penalty: -1 }); }
    
    const c = Math.abs(this.last_report.centerline);
    if (c > 25) { score -= 10; deductions.push({ reason: `Off runway (${c.toFixed(1)}m)`, penalty: -10 }); }
    else if (c > 15) { score -= 6; deductions.push({ reason: `Severe centerline dev (${c.toFixed(1)}m)`, penalty: -6 }); }
    else if (c > 10) { score -= 3; deductions.push({ reason: `Moderate centerline dev (${c.toFixed(1)}m)`, penalty: -3 }); }
    else if (c > 5) { score -= 1; deductions.push({ reason: `Slight centerline dev (${c.toFixed(1)}m)`, penalty: -1 }); }
    
    return { score: Math.max(0, score), deductions };
  }

  async finalizeFlight() {
    this.flight_reported = true;
    const { score, deductions } = this.calculateScore();
    this.last_report.score = score;
    this.last_report.deductions = deductions;
    
    const payload = {
      aircraft: this.ifc.aircraft_id,
      vs_touchdown: Math.round(this.last_report.rate_fpm),
      g_force: parseFloat(this.last_report.g_force.toFixed(2)),
      centerline_dev: parseFloat(this.last_report.centerline.toFixed(2)),
      bounce_count: this.bounce_count,
      light_infractions: this.light_infractions,
      status: this.last_report.status,
      score: score,
      fuel_weight_kg: parseFloat(this.landing_fuel.toFixed(1)),
      landing_lat: parseFloat(this.landing_lat.toFixed(6)),
      landing_lon: parseFloat(this.landing_lon.toFixed(6)),
      ias_violations: this.ias_violation_count,
      unstable_approaches: this.unstable_appr_count,
      distance_from_1kft: parseFloat(this.last_report.distance_from_1kft.toFixed(2)),
      deductions: deductions
    };
    
    console.log('[FLIGHT TRACKER] Finalizing Flight. Payload:', JSON.stringify(payload));
    DeviceEventEmitter.emit('FLIGHT_FINISHED', payload);
  }
}
