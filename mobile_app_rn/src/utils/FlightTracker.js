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
    
    this.telemetry_log = [];
    this.last_telemetry_time = 0;
    
    this.flight_path = [];
    this.fuel_history = [];
    this.last_path_record_time = 0;
    
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
    
    this.status = "WAITING"; // WAITING, TAXI, TAKEOFF, CLIMB, CRUISE, DESCENT, APPROACH, LANDING, FINISHED
    this.touchdown_count = 0;
    
    this.first_telemetry_time = 0;
    this.max_landing_g_force = 1.0;
    this.touchdown_time = 0;
    
    // Subscribe to telemetry updates
    this.sub = DeviceEventEmitter.addListener('TELEMETRY_UPDATE', this.onTelemetryUpdate.bind(this));
    this.subManual = DeviceEventEmitter.addListener('FORCE_FINALIZE_FLIGHT', () => {
      console.log('[TRACKER] Finalização manual solicitada.');
      if (!this.flight_reported) {
        this.status = "FINISHED";
        this.finalizeFlight();
      }
    });
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
    if (this.flight_reported || this.status === "FINISHED") return;
    
    if (this.first_telemetry_time === 0) {
        this.first_telemetry_time = Date.now();
        console.log('[TRACKER] Aeronave detectada. Aguardando partida dos motores...');
    }
    
    // Fase de espera: Ignora multas at? os motores serem ligados e a f?sica assentar
    if (this.status === "WAITING") {
        this.was_grounded_prev = state.is_grounded;
        this.prev_vs = state.vs;
        this.prev_alt = state.alt;
        this.peak_g_force = state.g_force;
        
        // Se o motor estiver ligado E j? tiver passado 8s do spawn (para estabilizar a f?sica)
        if (!state.engines_off && (Date.now() - this.first_telemetry_time > 8000)) {
            this.status = "TAXI";
            console.log('[TRACKER] Motores Ligados e aeronave estabilizada! Rastreador ATIVADO.');
        }
        return;
    }
    
    // Initializer
    if (this.was_grounded_prev === undefined) {
      this.was_grounded_prev = state.is_grounded;
      this.prev_alt = state.alt;
      this.prev_vs = state.vs;
      return;
    }
    
    if (state.has_crashed) {
      this.last_report.status = "CRASHED";
      if (!this.flight_reported) this.finalizeFlight();
      return;
    }
    
    if (state.engines_off && state.is_grounded && this.status !== "TAXI") {
      if ((this.status === "LANDING" || this.status === "TAXI") && this.touchdown_count > 0 && !this.flight_reported) {
         this.status = "FINISHED";
         this.finalizeFlight();
      }
      return;
    }

    // Tracking Peak G
    if (!state.is_grounded && state.g_force > this.peak_g_force) {
      this.peak_g_force = state.g_force;
    }
    
    // Telemetry Logging (every 60 seconds)
    const now = Date.now();
    if (this.status !== "FINISHED" && (now - this.last_telemetry_time) >= 60000) {
      this.telemetry_log.push({
        time: Math.round(now / 1000),
        alt: Math.round(state.alt),
        gs: Math.round(state.gs)
      });
      this.last_telemetry_time = now;
    }

    // Path and Fuel Logging (every 10 seconds)
    if (this.status !== "FINISHED" && (now - this.last_path_record_time) >= 10000) {
      if (state.fuel_weight > 0) {
        this.fuel_history.push([now / 1000, state.fuel_weight]);
        this.fuel_history = this.fuel_history.filter(x => (now / 1000) - x[0] <= 300);
      }
      if (!state.is_grounded && Math.abs(state.lat) > 0.001 && Math.abs(state.lon) > 0.001) {
        const rounded_lat = parseFloat(state.lat.toFixed(6));
        const rounded_lon = parseFloat(state.lon.toFixed(6));
        if (this.flight_path.length === 0 || 
            this.flight_path[this.flight_path.length - 1][0] !== rounded_lat || 
            this.flight_path[this.flight_path.length - 1][1] !== rounded_lon) {
          this.flight_path.push([rounded_lat, rounded_lon]);
        }
      }
      this.last_path_record_time = now;
    }

    this.checkPhases(state);
    this.checkInfractions(state);
    
    this.prev_alt = state.alt;
  }

  checkPhases(state) {
    // Detect liftoff / bounce
    if (!state.is_grounded && this.was_grounded_prev) {
        if (this.touchdown_count > 0) {
            this.bounce_count++;
            this.addEvent(`BOUNCE #${this.bounce_count} (-4.0pt)`, "orange");
        }
        this.peak_g_force = 1.0;
        
        // Takeoff detection
        if (this.status === "TAXI" || this.status === "TAKEOFF") {
            this.status = "CLIMB";
            this.takeoff_fuel = state.fuel_weight;
            this.takeoff_time = Date.now();
            this.addEvent("Decolagem efetuada", "blue");
            
            if (state.gear_down !== undefined) {
                this.takeoff_gear_check_active = true;
                this.takeoff_gear_check_start = Date.now();
                this.gear_retracted_in_time = true;
                this.has_retractable_gear = true;
            }
        }
    }
    
    // Track airborne VS
    if (!state.is_grounded) {
        this.last_airborne_vs = state.vs;
        
        if (state.vs > 500) {
            this.status = state.alt < 10000 ? "CLIMB" : "CRUISE";
        } else if (state.vs < -500) {
            this.status = state.alt < 5000 ? "APPROACH" : "DESCENT";
        } else {
            this.status = "CRUISE";
        }
    }
    
    // Exact touchdown moment
    if (state.is_grounded && !this.was_grounded_prev) {
        this.touchdown_count++;
        this.touchdown_time = Date.now();
        
        const cap_vs = this.last_airborne_vs || state.vs;
        const cap_g = Math.max(this.peak_g_force, state.g_force);
        this.max_landing_g_force = Math.max(this.max_landing_g_force, cap_g);
        
        if (this.touchdown_count === 1) {
            this.status = "LANDING";
            this.last_report = {
                rate_fpm: cap_vs,
                g_force: this.max_landing_g_force,
                centerline: state.centerline || 0.0,
                distance_from_1kft: state.distance_from_1kft || 0.0,
                status: "LANDED",
                score: null,
                deductions: []
            };
            
            this.landing_lat = state.lat;
            this.landing_lon = state.lon;
            this.landing_fuel = state.fuel_weight;
            
            this.addEvent(`Toque #${this.touchdown_count}: ${Math.round(cap_vs)} FPM | ${this.max_landing_g_force.toFixed(2)}G`, "purple");
        } else {
            this.addEvent(`Toque #${this.touchdown_count} (Bounce)`, "purple");
        }
    }
    
    // Keep updating G-Force and Centerline for 5 seconds after touchdown to catch the peak API delay
    if (this.touchdown_time > 0 && (Date.now() - this.touchdown_time < 5000)) {
        this.max_landing_g_force = Math.max(this.max_landing_g_force, state.g_force);
        if (this.touchdown_count === 1) {
            this.last_report.g_force = this.max_landing_g_force;
            if (state.centerline !== 0) this.last_report.centerline = state.centerline;
            if (state.distance_from_1kft !== 0) this.last_report.distance_from_1kft = state.distance_from_1kft;
        }
    }
    
    // Taxi logic
    if (state.is_grounded && state.gs < 30) {
       if (this.status !== "LANDING" && this.status !== "FINISHED") {
         this.status = "TAXI";
       }
    } else if (state.is_grounded && state.gs >= 30 && this.status === "TAXI") {
       this.status = "TAKEOFF";
    }
    
    // Gear check
    if (this.takeoff_gear_check_active) {
        const elapsed = (Date.now() - this.takeoff_gear_check_start) / 1000.0;
        if (!state.gear_down) {
            this.gear_retraction_time_sec = elapsed;
            this.takeoff_gear_check_active = false;
            this.gear_retracted_in_time = true;
            this.addEvent(`Trem recolhido: ${elapsed.toFixed(1)}s`, "green");
        } else if (elapsed > 15.0) {
            this.takeoff_gear_check_active = false;
            this.gear_retracted_in_time = false;
            this.gear_retraction_time_sec = elapsed;
            this.addEvent("INFRAÇÃO: Trem não recolhido em 15s!", "red");
        }
    }
    
    this.was_grounded_prev = state.is_grounded;
    this.prev_vs = state.vs;
  }

  checkInfractions(state) {
    const now = Date.now();
    
    if (this.prev_alt > 0.1 && !state.is_grounded) {
      if (this.prev_alt < 10000 && state.alt >= 10000) {
        this.climb_10k_grace_start = now;
        this.descent_10k_grace_start = 0;
        this.addEvent("Subindo 10,000ft: 60s para desligar luzes", "blue");
      }
      if (this.prev_alt > 10000 && state.alt <= 10000) {
        this.descent_10k_grace_start = now;
        this.climb_10k_grace_start = 0;
        this.addEvent("Descendo 10,000ft: 60s para ligar luzes", "blue");
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
    if (!state.is_grounded && state.alt < 10000 && state.ias > 255) {
      if (!this._ias_viol_active) {
         this.ias_violation_count++;
         this._ias_viol_active = true;
         this.addEvent(`IAS ${Math.round(state.ias)}KTS >250 abaixo 10kft! (-0.5pt)`, "red");
      }
    } else if (state.ias <= 252) {
      this._ias_viol_active = false;
    }
    
    // Unstable Approach
    if (!state.is_grounded && state.agl < 500 && state.agl > 10) {
        const pitchDeg = Math.abs(state.pitch * (180/Math.PI) > 10 ? state.pitch * (180/Math.PI) : state.pitch);
        const bankDeg = Math.abs(state.bank * (180/Math.PI) > 20 ? state.bank * (180/Math.PI) : state.bank);
        
        if (pitchDeg > 10 || bankDeg > 20) {
            if (!this._unstable_active) {
                this.unstable_appr_count++;
                this._unstable_active = true;
                this.addEvent(`UNSTABLE: Pitch=${pitchDeg.toFixed(1)}° Bank=${bankDeg.toFixed(1)}° (-0.5pt)`, "red");
            }
        } else {
            this._unstable_active = false;
        }
    }
  }

  calculateScore() {
    if (this.last_report.status === "CRASHED") {
      return { score: 0.0, deductions: [{ reason: "AIRCRAFT CRASHED — INVALID FLIGHT", penalty: -10.0 }] };
    }
    
    let score = 10.0;
    const deductions = [];
    
    const g = this.last_report.g_force;
    if (g <= 1.20) { deductions.push({ reason: `Perfect landing (${g.toFixed(2)}G) ✓`, penalty: 0.0 }); }
    else if (g <= 1.50) { score -= 1.0; deductions.push({ reason: `Firm landing (${g.toFixed(2)}G)`, penalty: -1.0 }); }
    else if (g <= 2.00) { score -= 3.0; deductions.push({ reason: `Hard landing (${g.toFixed(2)}G)`, penalty: -3.0 }); }
    else if (g <= 3.00) { score -= 6.0; deductions.push({ reason: `Very hard landing (${g.toFixed(2)}G)`, penalty: -6.0 }); }
    else { score -= 10.0; deductions.push({ reason: `Excessive G-force landing (${g.toFixed(2)}G) — INVALID FLIGHT`, penalty: -10.0 }); }
    
    const vs = Math.abs(this.last_report.rate_fpm);
    if (vs <= 200) { deductions.push({ reason: `Smooth landing (${Math.round(vs)} FPM) ✓`, penalty: 0.0 }); }
    else if (vs <= 400) { score -= 1.0; deductions.push({ reason: `Normal landing (${Math.round(vs)} FPM)`, penalty: -1.0 }); }
    else if (vs <= 600) { score -= 3.0; deductions.push({ reason: `Firm landing (${Math.round(vs)} FPM)`, penalty: -3.0 }); }
    else if (vs <= 1000) { score -= 6.0; deductions.push({ reason: `Hard landing (${Math.round(vs)} FPM)`, penalty: -6.0 }); }
    else { score -= 10.0; deductions.push({ reason: `Extremely hard landing (${Math.round(vs)} FPM) — INVALID FLIGHT`, penalty: -10.0 }); }
    
    if (this.bounce_count > 0) {
        if (this.bounce_count === 1) { score -= 4.0; deductions.push({ reason: `1 bounce (-4.0pt)`, penalty: -4.0 }); }
        else { score -= 10.0; deductions.push({ reason: `${this.bounce_count} bounces — INVALID FLIGHT`, penalty: -10.0 }); }
    }
    
    const c = Math.abs(this.last_report.centerline);
    if (c <= 5) { deductions.push({ reason: `On centerline (${c.toFixed(1)}m) ✓`, penalty: 0.0 }); }
    else if (c <= 10) { score -= 1.0; deductions.push({ reason: `Slight centerline deviation (${c.toFixed(1)}m)`, penalty: -1.0 }); }
    else if (c <= 15) { score -= 3.0; deductions.push({ reason: `Moderate centerline deviation (${c.toFixed(1)}m)`, penalty: -3.0 }); }
    else if (c <= 25) { score -= 6.0; deductions.push({ reason: `Severe centerline deviation (${c.toFixed(1)}m)`, penalty: -6.0 }); }
    else { score -= 10.0; deductions.push({ reason: `Off runway (${c.toFixed(1)}m) — INVALID FLIGHT`, penalty: -10.0 }); }
    
    const dist = this.last_report.distance_from_1kft || 0.0;
    if (dist < -250.0) { score -= 10.0; deductions.push({ reason: `Undershoot landing (${dist.toFixed(1)}m) — INVALID FLIGHT`, penalty: -10.0 }); }
    else if (dist < -100.0) { score -= 1.5; deductions.push({ reason: `Short landing (${dist.toFixed(1)}m)`, penalty: -1.5 }); }
    else if (dist <= 200.0) { deductions.push({ reason: `On TDZ core / Aiming Point (${dist.toFixed(1)}m) ✓`, penalty: 0.0 }); }
    else if (dist <= 500.0) { score -= 3.0; deductions.push({ reason: `Long landing (${dist.toFixed(1)}m)`, penalty: -3.0 }); }
    else { score -= 6.0; deductions.push({ reason: `Deep long landing (${dist.toFixed(1)}m)`, penalty: -6.0 }); }
    
    if (this.has_retractable_gear && !this.gear_retracted_in_time) {
        score -= 1.5;
        deductions.push({ reason: `Landing gear not retracted within 15s after takeoff`, penalty: -1.5 });
    }
    
    this.light_infractions.forEach(inf => {
        score -= 1.0;
        deductions.push({ reason: inf, penalty: -1.0 });
    });
    
    if (deductions.some(d => d.penalty <= -10.0)) {
        return { score: 0.0, deductions };
    }
    
    const n_ias = Math.min(this.ias_violation_count, 4);
    if (n_ias > 0) {
        score -= (n_ias * 0.5);
        deductions.push({ reason: `IAS >250KTS below 10,000ft (${n_ias}x)`, penalty: -(n_ias * 0.5) });
    }
    
    const n_ua = Math.min(this.unstable_appr_count, 4);
    if (n_ua > 0) {
        score -= (n_ua * 0.5);
        deductions.push({ reason: `Unstable approach below 500ft (${n_ua}x)`, penalty: -(n_ua * 0.5) });
    }
    
    return { score: parseFloat(Math.max(0, score).toFixed(2)), deductions };
  }

  async finalizeFlight() {
    this.flight_reported = true;
    const { score, deductions } = this.calculateScore();
    this.last_report.score = score;
    this.last_report.deductions = deductions;
    
    const is_severe_g_force = this.last_report.g_force > 3.0;
    const is_severe_vs = Math.abs(this.last_report.rate_fpm) > 1000;
    const is_severe_centerline = Math.abs(this.last_report.centerline) > 25;
    const is_severe_bounce = this.bounce_count >= 2;

    if (this.has_crashed || is_severe_g_force || is_severe_vs || is_severe_centerline || is_severe_bounce) {
        this.last_report.status = "CRASHED";
    } else {
        this.last_report.status = "LANDED";
    }

    const payload = {
      aircraft: this.ifc.aircraft_id || "Unknown",
      vs_touchdown: Math.round(this.last_report.rate_fpm),
      g_force: parseFloat(this.last_report.g_force.toFixed(2)),
      bounce_count: this.bounce_count || 0,
      light_infractions: this.light_infractions,
      status: this.last_report.status,
      score: score,
      fuel_weight_kg: parseFloat((this.landing_fuel || 0).toFixed(1)),
      landing_lat: parseFloat((this.landing_lat || 0).toFixed(6)),
      landing_lon: parseFloat((this.landing_lon || 0).toFixed(6)),
      ias_violations: this.ias_violation_count,
      unstable_approaches: this.unstable_appr_count,
      distance_from_1kft: parseFloat((this.last_report.distance_from_1kft || 0).toFixed(2)),
      centerline_dev: parseFloat((this.last_report.centerline || 0).toFixed(2)),
      has_retractable_gear: this.has_retractable_gear || false,
      gear_retraction_time: parseFloat((this.gear_retraction_time_sec || 0).toFixed(1)),
      deductions: deductions,
      telemetry_log: this.telemetry_log,
      flight_path: this.flight_path
    };
    
    console.log('[FLIGHT TRACKER] Finalizing Flight. Payload:', JSON.stringify(payload));
    DeviceEventEmitter.emit('FLIGHT_FINISHED', payload);
  }
}
