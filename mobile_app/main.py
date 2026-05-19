import flet as ft
import math
import socket
import struct
import threading
import time
import requests
import sys

class LoggerStream:
    def __init__(self, original_stream, prefix=""):
        self.original_stream = original_stream
        self.prefix = prefix
        self.logs = []
    def write(self, message):
        if message.strip():
            self.logs.append(f"{self.prefix}{message.strip()}")
            if len(self.logs) > 200:
                self.logs.pop(0)
        try: self.original_stream.write(message)
        except: pass
    def flush(self):
        try: self.original_stream.flush()
        except: pass

global_logger = LoggerStream(sys.stdout)
sys.stdout = global_logger
sys.stderr = LoggerStream(sys.stderr, "[ERRO] ")
sys.stderr.logs = global_logger.logs  # Share the same list

DEFAULT_BACKEND = "https://infinite-flight-crew-center.onrender.com"

# ══════════════════════════════════════════════════════════════════════════════
class IFConnectV2:
    def __init__(self):
        self.port = 10112
        self.sock = None
        self.connected = False
        self.running = False
        self.pilot_token = ""
        self.backend_url = DEFAULT_BACKEND

        self.vs = 0.0; self.gs = 0.0; self.alt = 0.0; self.g_force = 1.0
        self.is_grounded = True; self.engines_off = True
        self.has_crashed = False; self.aircraft_id = "Unknown"
        self.nav_on = self.beacon_on = self.strobe_on = self.landing_on = False
        self.no_smoking_on = False; self.seatbelt_on = False

        # Novos campos de telemetria
        self.fuel_weight   = 0.0   # kg
        self.lat           = 0.0   # graus
        self.lon           = 0.0   # graus
        self.ias           = 0.0   # knots
        self.pitch_deg     = 0.0   # graus
        self.bank_deg      = 0.0   # graus
        self.agl           = 0.0   # ft acima do solo
        self.live_centerline = 0.0
        self.live_distance_from_1kft = 0.0

        self.aircraft_ready = False
        self.connection_time = 0.0
        self.stable_data_count = 0

        self.peak_g_force  = 1.0
        self.bounce_count  = 0
        self.touchdown_count = 0
        self.flight_reported = False
        self.light_infractions = []
        self.takeoff_fuel = 0.0
        self.takeoff_time = 0.0
        self.fuel_history = []
        self.gear_down = True
        self.takeoff_gear_check_active = False
        self.takeoff_gear_check_start = 0.0
        self.gear_retracted_in_time = True
        self.gear_retraction_time_sec = 0.0
        self.has_retractable_gear = False
        self.is_ga = False
        self.has_passed_10k = False
        self.prev_alt = 0.0
        self.climb_10k_grace_start = 0.0
        self.descent_10k_grace_start = 0.0
        self.last_airborne_vs = 0.0
        self.events = []
        self.last_report = {
            "rate_fpm": 0, "g_force": 1.0, "centerline": 0.0, "distance_from_1kft": 0.0,
            "status": "WAITING", "score": None, "deductions": []
        }
        # Infrações detectadas em voo
        self.ias_violation_count   = 0
        self.unstable_appr_count   = 0
        self._ias_viol_active      = False
        self._unstable_active      = False
        # Dados capturados no toque
        self.landing_lat  = 0.0
        self.landing_lon  = 0.0
        self.landing_fuel = 0.0
        self.flight_path  = []
        self.last_path_record_time = 0

        self.manifest = {}
        self.ids = {}

    def reset_flight(self):
        self.light_infractions.clear()
        self.events.clear()
        self.bounce_count = 0
        self.touchdown_count = 0
        self.peak_g_force = 1.0
        self.flight_reported = False
        self.ias_violation_count = 0
        self.unstable_appr_count = 0
        self._ias_viol_active    = False
        self._unstable_active    = False
        self.no_smoking_on = False
        self.seatbelt_on = False
        self.takeoff_fuel = 0.0
        self.takeoff_time = 0.0
        self.fuel_history.clear()
        self.gear_down = True
        self.takeoff_gear_check_active = False
        self.takeoff_gear_check_start = 0.0
        self.gear_retracted_in_time = True
        self.gear_retraction_time_sec = 0.0
        self.has_retractable_gear = False
        self.is_ga = False
        self.has_passed_10k = False
        self.prev_alt = 0.0
        self.climb_10k_grace_start = 0.0
        self.descent_10k_grace_start = 0.0
        self.last_airborne_vs = 0.0
        self.landing_lat  = 0.0
        self.landing_lon  = 0.0
        self.landing_fuel = 0.0
        self.flight_path.clear()
        self.last_path_record_time = 0
        self.live_centerline = 0.0
        self.live_distance_from_1kft = 0.0
        self.last_report = {
            "rate_fpm": 0, "g_force": 1.0, "centerline": 0.0, "distance_from_1kft": 0.0,
            "status": "WAITING", "score": None, "deductions": []
        }

    def discover_ip(self):
        lock = None
        try:
            import os
            is_android = "ANDROID_ARGUMENT" in os.environ or os.path.exists("/system/app")
            if is_android:
                from java import jclass
                platform = jclass("com.chaquo.python.android.AndroidPlatform")
                context = platform.getApplication()
                Context = jclass("android.content.Context")
                wifi_manager = context.getSystemService(Context.WIFI_SERVICE)
                lock = wifi_manager.createMulticastLock("IF_Crew_Center_Multicast_Lock")
                lock.setReferenceCounted(True)
                lock.acquire()
        except Exception as e:
            print(f"Erro MulticastLock: {e}")

        udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            udp.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        except: pass
        udp.bind(("", 15000))
        udp.settimeout(8)
        try:
            _, addr = udp.recvfrom(4096)
            return addr[0]
        except: return None
        finally:
            udp.close()
            try:
                if lock: lock.release()
            except: pass

    def connect(self, ip):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.settimeout(10)
            self.sock.connect((ip, self.port))
            self.connected = True
            self.get_manifest()
            self.sock.settimeout(2)
            return True
        except Exception as e:
            print(f"Conexão falhou: {e}")
            return False

    def add_event(self, msg, color="white"):
        if not self.events or self.events[-1][0] != msg:
            self.events.append((msg, color))
            if len(self.events) > 15:
                self.events.pop(0)

    def add_light_infraction(self, msg):
        if msg not in self.light_infractions:
            self.light_infractions.append(msg)
            self.add_event(f"INFRAÇÃO: {msg}", "red")

    def calculate_score(self):
        if self.last_report["status"] == "CRASHED":
            return 0.0, [("AIRCRAFT CRASHED — INVALID FLIGHT", -10.0)]
        score = 10.0; deductions = []
        g = self.last_report["g_force"]
        if g <= 1.20:   d, lbl =  0.0, f"Perfect landing ({g:.2f}G) ✓"
        elif g <= 1.50: d, lbl = -1.0, f"Firm landing ({g:.2f}G)"
        elif g <= 2.00: d, lbl = -3.0, f"Hard landing ({g:.2f}G)"
        elif g <= 3.00: d, lbl = -6.0, f"Very hard landing ({g:.2f}G)"
        else:           d, lbl = -10.0, f"Excessive G-force landing ({g:.2f}G) — INVALID FLIGHT"
        score += d; deductions.append((lbl, d))

        vs = abs(self.last_report["rate_fpm"])
        if vs <= 200:   d, lbl =  0.0, f"Smooth landing ({int(vs)} FPM) ✓"
        elif vs <= 400: d, lbl = -1.0, f"Normal landing ({int(vs)} FPM)"
        elif vs <= 600: d, lbl = -3.0, f"Firm landing ({int(vs)} FPM)"
        elif vs <= 1000: d, lbl = -6.0, f"Hard landing ({int(vs)} FPM)"
        else:           d, lbl = -10.0, f"Extremely hard landing ({int(vs)} FPM) — INVALID FLIGHT"
        score += d; deductions.append((lbl, d))

        if self.bounce_count > 0:
            if self.bounce_count == 1: d, lbl = -4.0, f"1 bounce (-4.0pt)"
            else:                      d, lbl = -10.0, f"{self.bounce_count} bounces — INVALID FLIGHT"
            score += d; deductions.append((lbl, d))

        c = abs(self.last_report["centerline"])
        if c <= 5:   d, lbl =  0.0, f"On centerline ({c:.1f}m) ✓"
        elif c <= 10:  d, lbl = -1.0, f"Slight centerline deviation ({c:.1f}m)"
        elif c <= 15: d, lbl = -3.0, f"Moderate centerline deviation ({c:.1f}m)"
        elif c <= 25: d, lbl = -6.0, f"Severe centerline deviation ({c:.1f}m)"
        else:         d, lbl = -10.0, f"Off runway ({c:.1f}m) — INVALID FLIGHT"
        score += d; deductions.append((lbl, d))

        # TDZ / landing distance calculation
        dist = self.last_report.get("distance_from_1kft", 0.0)
        if dist < -250.0:  # Undershoot / touchdown before threshold
            d, lbl = -10.0, f"Undershoot landing (Touchdown before threshold: {dist:.1f}m) — INVALID FLIGHT"
        elif dist < -100.0:  # Short landing / before TDZ core
            d, lbl = -1.5, f"Short landing (Touchdown before TDZ: {dist:.1f}m)"
        elif dist <= 200.0:  # On Touchdown Zone / Aiming Point zone
            d, lbl =  0.0, f"On TDZ core / Aiming Point ({dist:.1f}m) ✓"
        elif dist <= 500.0:  # Long landing / beyond TDZ core
            d, lbl = -3.0, f"Long landing (Touchdown beyond TDZ: {dist:.1f}m)"
        else:  # Severe long landing / deep landing
            d, lbl = -6.0, f"Deep long landing (Touchdown deep down runway: {dist:.1f}m)"
        score += d; deductions.append((lbl, d))

        # Fuel reserve calculation
        fuel_min = self.last_report.get("fuel_reserve_minutes", 0.0)
        if fuel_min > 0.0:
            if fuel_min <= 25.0:
                d, lbl = -5.0, f"Insufficient fuel reserves (Only {fuel_min:.1f} min remaining < 25 min)"
            elif fuel_min <= 45.0:
                d, lbl = -1.5, f"Low fuel reserve at touchdown ({fuel_min:.1f} min remaining < 45 min)"
            else:
                d, lbl = 0.0, f"Fuel reserves managed correctly ({fuel_min:.1f} min remaining) ✓"
            score += d; deductions.append((lbl, d))

        # Landing gear retraction check
        if self.has_retractable_gear:
            if not self.gear_retracted_in_time:
                d, lbl = -1.5, f"Landing gear not retracted within 15s after takeoff ({self.gear_retraction_time_sec:.1f}s)"
            else:
                d, lbl = 0.0, f"Landing gear retracted correctly ({self.gear_retraction_time_sec:.1f}s) ✓"
            score += d; deductions.append((lbl, d))

        for inf in self.light_infractions:
            score -= 1.0; deductions.append((inf, -1.0))
        # Final disqualification if any deduction is -10.0
        if any(deduction[1] <= -10.0 for deduction in deductions):
            return 0.0, deductions
        # IAS Violation penalty
        n_ias = min(self.ias_violation_count, 4)
        if n_ias > 0:
            d = -(n_ias * 0.5)
            score += d
            deductions.append((f"IAS >250KTS below 10,000ft ({n_ias}x)", d))

        # Unstable Approach penalty
        n_ua = min(self.unstable_appr_count, 4)
        if n_ua > 0:
            d = -(n_ua * 0.5)
            score += d
            deductions.append((f"Unstable approach below 500ft ({n_ua}x)", d))

        return round(max(0.0, score), 2), deductions

    def is_aircraft_stable(self):
        if not self.aircraft_id or self.aircraft_id == "Unknown": return False
        if time.time() - self.connection_time > 3.0:
            if self.stable_data_count < 3:
                self.stable_data_count += 1
            return self.stable_data_count >= 3
        return False

    def is_aircraft_parked(self):
        return self.is_grounded and self.engines_off

    def check_all_infractions(self):
        if not self.aircraft_ready: return
        if self.is_aircraft_parked(): return
        
        # Detect crossing 10,000ft climbing / descending
        if self.prev_alt > 0.1 and not self.is_grounded:
            if self.prev_alt < 10000 <= self.alt:
                self.climb_10k_grace_start = time.time()
                self.descent_10k_grace_start = 0.0
                self.add_event("Climbing past 10,000ft: 60s grace period to turn OFF landing lights and seatbelts.", "blue")
            if self.prev_alt > 10000 >= self.alt:
                self.descent_10k_grace_start = time.time()
                self.climb_10k_grace_start = 0.0
                self.add_event("Descending below 10,000ft: 60s grace period to turn ON landing lights and seatbelts.", "blue")

        if self.alt > 10000:
            self.has_passed_10k = True

        if self.gs > 2 and not self.nav_on:
            self.add_light_infraction("NAV lights off in motion")
        if not self.engines_off and not self.beacon_on:
            self.add_light_infraction("BEACON lights off with engines running")
        if not self.is_grounded and not self.strobe_on:
            self.add_light_infraction("STROBE lights off in flight")
        
        # Landing lights check
        if self.alt > 10000 and self.landing_on:
            is_grace = self.climb_10k_grace_start > 0.0 and (time.time() - self.climb_10k_grace_start <= 60.0)
            if not is_grace:
                self.add_light_infraction("Landing lights on above 10,000ft")

        if not self.is_grounded and self.alt < 10000 and not self.landing_on:
            if not self.is_ga or self.has_passed_10k:
                is_grace = self.descent_10k_grace_start > 0.0 and (time.time() - self.descent_10k_grace_start <= 60.0)
                if not is_grace:
                    self.add_light_infraction("Landing lights off below 10,000ft")

        # No Smoking sign check
        if not self.no_smoking_on:
            if not self.is_ga or self.has_passed_10k:
                self.add_light_infraction("No Smoking sign is OFF")

        # Seat Belts sign check
        if self.alt < 10000 and not self.seatbelt_on:
            if not self.is_ga or self.has_passed_10k:
                is_grace = self.descent_10k_grace_start > 0.0 and (time.time() - self.descent_10k_grace_start <= 60.0)
                if not is_grace:
                    self.add_light_infraction("Seat Belts sign is OFF below 10,000ft")

        if self.alt > 10000 and self.seatbelt_on:
            if not self.is_ga or self.has_passed_10k:
                is_grace = self.climb_10k_grace_start > 0.0 and (time.time() - self.climb_10k_grace_start <= 60.0)
                if not is_grace:
                    self.add_light_infraction("Seat Belts sign is ON above 10,000ft")

    def send_report(self):
        score, deductions = self.calculate_score()
        # Convert list of tuples to list of dicts for clean JSON representation
        formatted_deductions = [{"reason": d[0], "penalty": d[1]} for d in deductions]
        self.last_report["score"] = score
        self.last_report["deductions"] = formatted_deductions
        print(f"PONTUAÇÃO: {score}/10.0")
        data = {
            "aircraft": self.aircraft_id,
            "vs_touchdown": int(self.last_report["rate_fpm"]),
            "g_force": round(self.last_report["g_force"], 2),
            "centerline_dev": round(self.last_report["centerline"], 2),
            "bounce_count": self.bounce_count,
            "light_infractions": self.light_infractions,
            "status": self.last_report["status"],
            "score": score,
            # Novos campos
            "fuel_weight_kg": round(self.landing_fuel, 1),
            "landing_lat": round(self.landing_lat, 6),
            "landing_lon": round(self.landing_lon, 6),
            "ias_violations": self.ias_violation_count,
            "unstable_approaches": self.unstable_appr_count,
            "distance_from_1kft": round(self.last_report.get("distance_from_1kft", 0.0), 2),
            "fuel_reserve_minutes": self.last_report.get("fuel_reserve_minutes", 0.0),
            "has_retractable_gear": self.has_retractable_gear,
            "gear_retraction_time": round(self.gear_retraction_time_sec, 1),
            "flight_path": self.flight_path,
            "deductions": formatted_deductions,
        }
        headers = {"Authorization": f"Token {self.pilot_token}"}
        try:
            requests.post(f"{self.backend_url}/landing-report/", json=data, headers=headers, timeout=5)
            self.add_event("DADOS ENVIADOS AO SERVIDOR!", "blue")
            send_system_notification(
                "🟢 VOO ENVIADO COM SUCESSO!",
                f"Toque: {int(self.last_report['rate_fpm'])} FPM | G: {self.last_report['g_force']:.2f}G | Pontuação: {score:.1f}/10"
            )
        except:
            self.add_event("SERVIDOR OFFLINE — DADOS LOCAIS", "orange")
            send_system_notification(
                "⚠️ DADOS SALVOS LOCAIS (Offline)",
                f"Toque: {int(self.last_report['rate_fpm'])} FPM | G: {self.last_report['g_force']:.2f}G | Pontuação: {score:.1f}/10"
            )

    def get_manifest(self):
        old_timeout = 2.0
        try:
            if self.sock:
                old_timeout = self.sock.gettimeout()
                self.sock.settimeout(15.0)
            self.sock.sendall(struct.pack('<ib', -1, 0))
            header = b""
            while len(header) < 12:
                chunk = self.sock.recv(12 - len(header))
                if not chunk: break
                header += chunk
            if len(header) < 12:
                if self.sock: self.sock.settimeout(old_timeout)
                return
            m_len = struct.unpack('<i', header[8:12])[0]
            data = b""
            while len(data) < m_len:
                packet = self.sock.recv(min(4096, m_len - len(data)))
                if not packet: break
                data += packet
            if self.sock: self.sock.settimeout(old_timeout)
            for line in data.decode('utf-8', errors='ignore').split('\n'):
                parts = line.split(',')
                if len(parts) >= 3:
                    try: self.manifest[parts[2].strip()] = int(parts[0])
                    except: pass
            self.ids = {
                "vs":          self.manifest.get("aircraft/0/vertical_speed"),
                "gs":          self.manifest.get("aircraft/0/groundspeed"),
                "grounded":    self.manifest.get("aircraft/0/is_on_ground"),
                "g_force":     self.manifest.get("aircraft/0/g_force_y"),
                "engines_off": self.manifest.get("aircraft/0/systems/engines/are_all_engines_off"),
                "crash":       self.manifest.get("aircraft/0/has_crashed"),
                "centerline":  self.manifest.get("simulator/statistics/last_landing/distance_from_centerline"),
                "distance_from_1kft": self.manifest.get("simulator/statistics/last_landing/distance_from_1kft_marker"),
                "alt":         self.manifest.get("aircraft/0/altitude_msl"),
                "agl":         self.manifest.get("aircraft/0/altitude_agl"),
                "aircraft_id": self.manifest.get("aircraft/0/aircraft_id"),
                "nav":         self.manifest.get("aircraft/0/systems/nav_lights_switch"),
                "beacon":      self.manifest.get("aircraft/0/systems/beacon_lights_switch"),
                "strobe":      self.manifest.get("aircraft/0/systems/strobe_lights_switch"),
                "landing":     self.manifest.get("aircraft/0/systems/landing_lights_switch"),
                "no_smoking":  self.manifest.get("aircraft/0/systems/signs/no_smoking"),
                "seatbelt":    self.manifest.get("aircraft/0/systems/signs/seatbelt"),
                # Novos campos
                "fuel_weight": self.manifest.get("aircraft/0/systems/fuel/weight"),
                "lat":         self.manifest.get("aircraft/0/latitude"),
                "lon":         self.manifest.get("aircraft/0/longitude"),
                "ias":         self.manifest.get("aircraft/0/indicated_airspeed"),
                "pitch":       self.manifest.get("aircraft/0/pitch"),
                "bank":        self.manifest.get("aircraft/0/bank"),
                "gear_lever":  self.manifest.get("aircraft/0/systems/landing_gear/lever_state"),
            }
            print(f"Manifesto OK: {sum(1 for v in self.ids.values() if v)} IDs")
        except Exception as e:
            print(f"Erro manifesto: {e}")
            try:
                if self.sock: self.sock.settimeout(old_timeout)
            except: pass

    def read_response(self):
        try:
            header = self.sock.recv(8)
            if len(header) < 8: return None
            cid, length = struct.unpack('<ii', header)
            payload = b""
            while len(payload) < length:
                chunk = self.sock.recv(length - len(payload))
                if not chunk: break
                payload += chunk
            return cid, payload
        except: return None

    def monitor_loop(self, update_callback):
        self.running = True
        self.connection_time = time.time()
        prev_grounded = True; prev_engines_off = True
        id_to_key = {v: k for k, v in self.ids.items() if v is not None}
        print("Monitoramento iniciado.")
        while self.running and self.connected:
            try:
                # Se não carregou os IDs (ex: conectado no menu principal), tenta carregar continuamente
                if not any(self.ids.values()):
                    self.get_manifest()
                    if any(self.ids.values()):
                        id_to_key = {v: k for k, v in self.ids.items() if v is not None}
                        self.add_event("🟢 Telemetria ativada!", "green")
                        send_system_notification("🟢 TELEMETRIA ATIVADA", "Co-piloto pronto para monitorar seu voo!")
                    else:
                        self.add_event("⚠️ Entre no cockpit para iniciar...", "orange")
                        update_callback()
                        time.sleep(2)
                        continue

                for cid in self.ids.values():
                    if cid is not None:
                        self.sock.sendall(struct.pack('<ib', cid, 0))
                for _ in range(30):
                    res = self.read_response()
                    if not res: break
                    cid, payload = res
                    key = id_to_key.get(cid)
                    if not key: continue
                    try:
                        if   key == "vs"          and len(payload) >= 4: self.vs = struct.unpack('<f', payload[:4])[0] * 196.85
                        elif key == "gs"          and len(payload) >= 4: self.gs = struct.unpack('<f', payload[:4])[0] * 1.94384
                        elif key == "alt"         and len(payload) >= 4: self.alt = struct.unpack('<f', payload[:4])[0] * 3.28084
                        elif key == "agl"         and len(payload) >= 4: self.agl = struct.unpack('<f', payload[:4])[0] * 3.28084
                        elif key == "g_force"     and len(payload) >= 4:
                            self.g_force = abs(struct.unpack('<f', payload[:4])[0])
                            if not self.is_grounded and self.g_force > self.peak_g_force:
                                self.peak_g_force = self.g_force
                        elif key == "centerline"  and len(payload) >= 4: self.live_centerline = struct.unpack('<f', payload[:4])[0]
                        elif key == "distance_from_1kft" and len(payload) >= 4: self.live_distance_from_1kft = struct.unpack('<f', payload[:4])[0]
                        elif key == "grounded"    and len(payload) >= 1: self.is_grounded = struct.unpack('<?', payload[:1])[0]
                        elif key == "engines_off" and len(payload) >= 1: self.engines_off = struct.unpack('<?', payload[:1])[0]
                        elif key == "crash"       and len(payload) >= 1: self.has_crashed = struct.unpack('<?', payload[:1])[0]
                        elif key == "nav"         and len(payload) >= 1: self.nav_on     = struct.unpack('<?', payload[:1])[0]
                        elif key == "beacon"      and len(payload) >= 1: self.beacon_on  = struct.unpack('<?', payload[:1])[0]
                        elif key == "strobe"      and len(payload) >= 1: self.strobe_on  = struct.unpack('<?', payload[:1])[0]
                        elif key == "landing"     and len(payload) >= 1: self.landing_on = struct.unpack('<?', payload[:1])[0]
                        elif key == "no_smoking"  and len(payload) >= 1: self.no_smoking_on = struct.unpack('<?', payload[:1])[0]
                        elif key == "seatbelt"    and len(payload) >= 1: self.seatbelt_on   = struct.unpack('<?', payload[:1])[0]
                        elif key == "aircraft_id":
                            self.aircraft_id = payload.decode('utf-8', errors='ignore').strip('\x00')
                            ga_keywords = ["c172", "xcub", "sr22", "c208", "decathlon", "cubcrafters", "spitfire", "p38", "bonanza", "baron", "172", "152", "182", "310", "414", "piper", "cessna", "cirrus", "beech", "m20", "mooney", "dr400", "vl3"]
                            ac_id_lower = self.aircraft_id.lower()
                            self.is_ga = any(kw in ac_id_lower for kw in ga_keywords)
                        # Novos campos
                        elif key == "fuel_weight" and len(payload) >= 4: self.fuel_weight = struct.unpack('<f', payload[:4])[0]
                        elif key == "lat"         and len(payload) >= 4: self.lat = math.degrees(struct.unpack('<f', payload[:4])[0])
                        elif key == "lon"         and len(payload) >= 4: self.lon = math.degrees(struct.unpack('<f', payload[:4])[0])
                        elif key == "ias"         and len(payload) >= 4: self.ias = struct.unpack('<f', payload[:4])[0] * 1.94384
                        elif key == "pitch"       and len(payload) >= 4: self.pitch_deg = math.degrees(struct.unpack('<f', payload[:4])[0])
                        elif key == "bank"        and len(payload) >= 4: self.bank_deg  = math.degrees(struct.unpack('<f', payload[:4])[0])
                        elif key == "gear_lever"  and len(payload) >= 1: self.gear_down = struct.unpack('<?', payload[:1])[0]
                    except: continue

                # ── Regra IAS: abaixo de 10.000ft deve ser ≤ 250 KIAS
                if not self.is_grounded and self.alt < 10000 and self.ias > 255:
                    if not self._ias_viol_active:
                        self._ias_viol_active = True
                        self.ias_violation_count += 1
                        self.add_event(f"IAS {int(self.ias)} KTS >250 abaixo 10kft! (-0.5pt)", "orange")
                elif self.ias <= 252:
                    self._ias_viol_active = False

                # ── Regra Aproximação Instável: abaixo de 500ft AGL
                if not self.is_grounded and self.agl < 500:
                    if abs(self.bank_deg) > 20 or abs(self.pitch_deg) > 10:
                        if not self._unstable_active:
                            self._unstable_active = True
                            self.unstable_appr_count += 1
                            self.add_event(
                                f"UNSTABLE: Pitch={self.pitch_deg:.1f}° Bank={self.bank_deg:.1f}° (-0.5pt)",
                                "orange"
                            )
                    else:
                        self._unstable_active = False

                if self.touchdown_count > 0:
                    # Continuously capture the actual landing stats once the simulator updates them after touchdown!
                    self.last_report["centerline"] = self.live_centerline
                    self.last_report["distance_from_1kft"] = self.live_distance_from_1kft

                if not self.aircraft_ready:
                    if self.is_aircraft_stable():
                        self.aircraft_ready = True
                        self.add_event("🟢 AERONAVE PRONTA - Monitoramento ativo", "green")
                        try: send_system_notification("🟢 Aeronave Pronta", "Sistema de monitoramento ativo. Bons voos!")
                        except: pass
                        print(f"Aircraft ready after {time.time() - self.connection_time:.1f}s")
                    else:
                        update_callback()
                        time.sleep(0.1)
                        continue
                        
                if self.aircraft_ready:
                    self.check_all_infractions()


                if prev_grounded and not self.is_grounded:
                    if self.touchdown_count > 0:
                        self.bounce_count += 1
                        self.add_event(f"BOUNCE #{self.bounce_count} (-1.0pt)", "orange")
                    self.peak_g_force = 1.0
                    if self.takeoff_time == 0.0:
                        self.takeoff_time = time.time()
                        self.takeoff_fuel = self.fuel_weight
                        self.fuel_history = [(self.takeoff_time, self.fuel_weight)]
                        
                        is_retractable = True
                        if self.ids.get("gear_lever") is None:
                            is_retractable = False
                        else:
                            fixed_gear_keywords = ["c172", "xcub", "sr22", "c208", "decathlon", "cubcrafters", "cessna 172"]
                            ac_id_lower = self.aircraft_id.lower()
                            if any(kw in ac_id_lower for kw in fixed_gear_keywords):
                                is_retractable = False
                                
                        if is_retractable:
                            self.takeoff_gear_check_active = True
                            self.takeoff_gear_check_start = time.time()
                            self.gear_retracted_in_time = True
                            self.gear_retraction_time_sec = 0.0
                            self.has_retractable_gear = True
                        else:
                            self.has_retractable_gear = False

                if not self.is_grounded:
                    self.last_airborne_vs = self.vs

                if not prev_grounded and self.is_grounded:
                    self.touchdown_count += 1
                    cap_g  = max(self.peak_g_force, self.g_force)
                    cap_vs = self.last_airborne_vs
                    
                    # Only record the primary landing telemetry on the FIRST contact
                    if self.touchdown_count == 1:
                        self.last_report["rate_fpm"] = cap_vs
                        self.last_report["g_force"]  = cap_g
                        self.last_report["centerline"] = self.live_centerline
                        self.last_report["distance_from_1kft"] = self.live_distance_from_1kft
                        self.landing_lat  = self.lat
                        self.landing_lon  = self.lon
                        self.landing_fuel = self.fuel_weight
                    
                    # Check for severe infractions that should result in a CRASHED status
                    is_severe_g_force = self.last_report.get("g_force", 1.0) > 3.0
                    is_severe_vs = abs(self.last_report.get("rate_fpm", 0.0)) > 1000 # FPM
                    is_severe_centerline = abs(self.last_report.get("centerline", 0.0)) > 25 # meters
                    is_severe_bounce = self.bounce_count >= 2

                    if self.has_crashed or is_severe_g_force or is_severe_vs or is_severe_centerline or is_severe_bounce:
                        self.last_report["status"] = "CRASHED"
                    else:
                        self.last_report["status"] = "LANDED"
                        
                    print(f"TOQUE #{self.touchdown_count}: {int(cap_vs)} FPM | {cap_g:.2f}G (Bounce Count: {self.bounce_count})")
                    self.add_event(
                        f"TOQUE #{self.touchdown_count}: {int(cap_vs)} FPM | {cap_g:.2f}G",
                        "red" if self.has_crashed else "green"
                    )

                if self.takeoff_gear_check_active:
                    elapsed = time.time() - self.takeoff_gear_check_start
                    if not self.gear_down:
                        self.gear_retraction_time_sec = elapsed
                        self.takeoff_gear_check_active = False
                        self.gear_retracted_in_time = True
                        self.add_event(f"GEAR RETRACTED: {elapsed:.1f}s after takeoff", "green")
                    elif elapsed > 15.0:
                        self.takeoff_gear_check_active = False
                        self.gear_retracted_in_time = False
                        self.gear_retraction_time_sec = elapsed
                        self.add_event("INFRAÇÃO: Landing gear not retracted in 15s!", "red")

                # ── Record flight path coordinates and fuel history every 10 seconds
                curr_t = time.time()
                if curr_t - self.last_path_record_time >= 10:
                    if self.fuel_weight > 0:
                        self.fuel_history.append((curr_t, self.fuel_weight))
                        self.fuel_history = [x for x in self.fuel_history if curr_t - x[0] <= 300]
                    if not self.is_grounded and abs(self.lat) > 0.001 and abs(self.lon) > 0.001:
                        rounded_lat = round(self.lat, 6)
                        rounded_lon = round(self.lon, 6)
                        if not self.flight_path or self.flight_path[-1] != [rounded_lat, rounded_lon]:
                            self.flight_path.append([rounded_lat, rounded_lon])
                    self.last_path_record_time = curr_t

                if not prev_engines_off and self.engines_off and self.is_grounded:
                    if not self.flight_reported and self.touchdown_count > 0:
                        self.flight_reported = True
                        self.send_report()

                self.prev_alt = self.alt
                prev_grounded    = self.is_grounded
                prev_engines_off = self.engines_off
                update_callback()
                time.sleep(0.05)
            except Exception as e:
                print(f"Monitor erro: {e}")
                break


def send_system_notification(title, message):
    try:
        # Check if we are running on Android (e.g. Chaquopy inside Flet Android)
        import os
        is_android = False
        try:
            from java import jclass
            is_android = True
        except ImportError:
            try:
                from jnius import autoclass
                is_android = True
            except ImportError:
                if "ANDROID_ARGUMENT" in os.environ or os.path.exists("/system/app"):
                    is_android = True

        if is_android:
            try:
                from java import jclass
                platform = jclass("com.chaquo.python.android.AndroidPlatform")
                context = platform.getApplication()
                
                # Get NotificationManager
                Context = jclass("android.content.Context")
                notification_manager = context.getSystemService(Context.NOTIFICATION_SERVICE)
                
                # Create Notification Channel (Android 8.0+)
                channel_id = "if_crew_center_notifications"
                Build = jclass("android.os.Build")
                if Build.VERSION.SDK_INT >= 26:
                    NotificationChannel = jclass("android.app.NotificationChannel")
                    importance = 4  # IMPORTANCE_HIGH
                    channel = NotificationChannel(channel_id, "IF Crew Center", importance)
                    channel.setDescription("Notificações de status do Co-Piloto")
                    notification_manager.createNotificationChannel(channel)
                
                # Build Notification
                Builder = jclass("android.app.Notification$Builder")
                R = jclass("android.R")
                icon_id = R.drawable.ic_dialog_info
                
                if Build.VERSION.SDK_INT >= 26:
                    builder = Builder(context, channel_id)
                else:
                    builder = Builder(context)
                
                builder.setContentTitle(title) \
                       .setContentText(message) \
                       .setSmallIcon(icon_id) \
                       .setAutoCancel(True)
                
                if Build.VERSION.SDK_INT >= 16:
                    builder.setPriority(2)  # PRIORITY_HIGH
                
                notification = builder.build()
                notification_manager.notify(999, notification)
                print("Android status notification sent successfully!")
                return
            except Exception as e_android:
                print(f"Android system notification failed: {e_android}")
                
                # Fallback to Toast if activity is active
                try:
                    activity = platform.getActivity()
                    if activity:
                        Toast = jclass("android.widget.Toast")
                        activity.runOnUiThread(lambda: Toast.makeText(activity, f"{title}\n{message}", Toast.LENGTH_LONG).show())
                        return
                except Exception as e_toast:
                    print(f"Toast fallback failed: {e_toast}")

        # Fallback to Windows PowerShell Notification (for PC testing/Windows)
        import subprocess
        safe_title = title.replace('"', '\\"')
        safe_message = message.replace('"', '\\"')
        ps_code = f"""
        [void] [System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms")
        $objNotifyIcon = New-Object System.Windows.Forms.NotifyIcon
        $objNotifyIcon.Icon = [System.Drawing.SystemIcons]::Information
        $objNotifyIcon.BalloonTipIcon = "Info"
        $objNotifyIcon.BalloonTipTitle = "{safe_title}"
        $objNotifyIcon.BalloonTipText = "{safe_message}"
        $objNotifyIcon.Visible = $True
        $objNotifyIcon.ShowBalloonTip(10000)
        """
        subprocess.Popen(["powershell", "-WindowStyle", "Hidden", "-Command", ps_code], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except Exception as e:
        print(f"Notification error: {e}")


# ══════════════════════════════════════════════════════════════════════════════
def main(page: ft.Page):
    page.title  = "IF Crew Center"
    page.bgcolor = "#060d18"
    page.window_width  = 400
    page.window_height = 780
    page.padding = 0

    client  = IFConnectV2()
    session = {"token": None, "username_ifc": None, "full_name": None}

    C_CARD   = "#0d1b2a"
    C_ACCENT = "#4dabf5"
    C_GREEN  = "#00e676"
    C_RED    = "#f44336"
    C_ORANGE = "#ff9800"

    # ── Raiz única: toda navegação troca o conteúdo aqui ─────────────────────
    root = ft.Column(expand=True, scroll="auto", spacing=0)
    page.add(root)

    def set_view(controls):
        root.controls.clear()
        root.controls.extend(controls)
        page.update()

    # ─────────────────────────────────────────────────────────────────────────
    # TELA 1 — LOGIN
    # ─────────────────────────────────────────────────────────────────────────
    def show_login(error_msg=""):
        email_field    = ft.TextField(label="E-mail", text_size=14,
                                       border_color=C_ACCENT, focused_border_color=C_ACCENT,
                                       bgcolor=C_CARD, width=320)
        password_field = ft.TextField(label="Senha", password=True, can_reveal_password=True,
                                       text_size=14, border_color=C_ACCENT,
                                       focused_border_color=C_ACCENT, bgcolor=C_CARD, width=320)
        error_text     = ft.Text(error_msg, color=C_RED, size=12, visible=bool(error_msg))
        btn_login      = ft.ElevatedButton("ENTRAR", height=50, width=320)
        loading        = ft.Text("Autenticando...", color=C_ACCENT, size=13, visible=False)

        def do_login(e):
            error_text.visible = False
            loading.visible    = True
            btn_login.disabled = True
            page.update()
            backend = DEFAULT_BACKEND.rstrip("/")
            client.backend_url = backend
            try:
                url = f"{backend}/login/"
                print(f"POST {url}")
                r = requests.post(url,
                    json={"email": email_field.value, "password": password_field.value},
                    timeout=8)
                print(f"Status: {r.status_code} | {r.text[:200]}")
                if r.status_code == 200:
                    data = r.json()
                    session["token"]        = data["token"]
                    session["username_ifc"] = data["user"].get("usernameIFC") or data["user"].get("first_name", "Piloto")
                    session["full_name"]    = f"{data['user'].get('first_name','')} {data['user'].get('last_name','')}".strip()
                    client.pilot_token = session["token"]
                    show_dashboard()
                    return
                else:
                    body = r.json()
                    error_text.value = body.get("error") or str(body.get("non_field_errors", "Credenciais inválidas"))
                    error_text.visible = True
            except Exception as ex:
                error_text.value   = f"Servidor indisponível: {ex}"
                error_text.visible = True
            loading.visible    = False
            btn_login.disabled = False
            page.update()

        btn_login.on_click = do_login

        set_view([
            ft.Container(
                padding=ft.Padding(30, 20, 30, 20),
                content=ft.Column([
                    ft.Container(height=20),
                    ft.Column([
                        ft.Text("✈", size=52, color=C_ACCENT),
                        ft.Text("IF CREW CENTER", size=22, weight="bold", color="white"),
                        ft.Text("Virtual Co-Pilot", size=13, color="white60"),
                    ], horizontal_alignment="center", spacing=4),
                    ft.Container(height=24),
                    email_field,
                    ft.Container(height=8),
                    password_field,
                    ft.Container(height=4),
                    error_text,
                    ft.Container(height=14),
                    btn_login,
                    loading,
                    ft.Container(height=16),
                    ft.Divider(color="white10"),
                    ft.Text("Use as mesmas credenciais do site IF Crew Center",
                            size=11, color="white30"),
                ], horizontal_alignment="center", spacing=4)
            )
        ])

    # ─────────────────────────────────────────────────────────────────────────
    # TELA 2 — DASHBOARD
    # ─────────────────────────────────────────────────────────────────────────
    def show_dashboard():
        vs_text     = ft.Text("0 FPM",    size=44, weight="bold", color="white")
        gs_text     = ft.Text("GS: 0",    size=13, color="white60")
        alt_text    = ft.Text("ALT: 0",   size=13, color="white60")
        g_text      = ft.Text("G: 1.00",  size=13, color="white60")
        ac_text     = ft.Text("",         size=12, color=C_ACCENT)
        conn_status = ft.Text("● DESCONECTADO", color=C_RED, size=13, weight="bold")
        event_list  = ft.ListView(spacing=4, padding=8)
        score_col   = ft.Column(visible=False, horizontal_alignment="center", spacing=6)
        score_wrap  = ft.Container(content=score_col, bgcolor=C_CARD,
                                    border_radius=14, padding=20, visible=False)
        hud_wrap    = ft.Container(visible=False)
        start_btn   = ft.ElevatedButton("▶  INICIAR MONITORAMENTO", height=52, width=320)
        logout_btn  = ft.ElevatedButton("Sair", height=36)

        def build_score_card():
            score      = client.last_report.get("score")
            deductions = client.last_report.get("deductions", [])
            if score is None: return
            sc = C_GREEN if score >= 9 else ("#69f0ae" if score >= 7 else
                 ("#ffeb3b" if score >= 5 else (C_ORANGE if score >= 3 else C_RED)))
            score_col.controls.clear()
            score_col.controls += [
                ft.Text("RELATÓRIO DO VOO", size=12, weight="bold", color="white60"),
                ft.Text(f"{score:.1f}", size=60, weight="bold", color=sc),
                ft.Text("/ 10.0", size=13, color="white60"),
                ft.Divider(color="white10"),
            ]
            for lbl, val in deductions:
                c   = C_GREEN if val >= 0 else C_RED
                pfx = "✓" if val == 0 else f"{val:+.1f}"
                score_col.controls.append(ft.Text(f"{pfx}  {lbl}", size=12, color=c))
            score_col.visible  = True
            score_wrap.visible = True

        def on_update():
            try:
                vs_text.value  = f"{int(client.vs)} FPM"
                vs_text.color  = C_GREEN if client.vs > -500 else (C_RED if client.vs < -1200 else "white")
                gs_text.value  = f"GS: {int(client.gs)} KTS"
                alt_text.value = f"ALT: {int(client.alt)} FT"
                g_text.value   = f"G: {client.g_force:.2f}"
                ac_text.value  = client.aircraft_id if client.aircraft_id != "Unknown" else ""
                event_list.controls.clear()
                for msg, color in reversed(client.events):
                    event_list.controls.append(
                        ft.Text(f"› {msg}", color=color, size=13, weight="bold")
                    )
                if client.last_report.get("score") is not None and not score_col.visible:
                    build_score_card()
                page.update()
            except: pass

        def start_click(e):
            start_btn.disabled = True
            conn_status.value  = "● PROCURANDO SIMULADOR..."
            conn_status.color  = C_ORANGE
            page.update()
            client.reset_flight()
            score_col.visible  = False
            score_wrap.visible = False

            def do_connect():
                for attempt in range(1, 6):
                    conn_status.value  = f"● PROCURANDO SIMULADOR ({attempt}/5)..."
                    page.update()
                    ip = client.discover_ip()
                    if ip and client.connect(ip):
                        conn_status.value = f"● CONECTADO  {ip}"
                        conn_status.color = C_GREEN
                        hud_wrap.visible  = True
                        page.update()
                        send_system_notification("🟢 CONECTADO AO SIMULADOR!", "A conexão com o Infinite Flight foi estabelecida com sucesso. Bons voos, comandante!")
                        client.monitor_loop(on_update)
                        conn_status.value  = "● DESCONECTADO"
                        conn_status.color  = C_RED
                        start_btn.disabled = False
                        page.update()
                        send_system_notification("🔴 DESCONECTADO DO SIMULADOR", "A conexão com o Infinite Flight foi finalizada.")
                        return
                    time.sleep(1)
                
                conn_status.value  = "● SIMULADOR NÃO ENCONTRADO"
                conn_status.color  = C_RED
                start_btn.disabled = False
                page.update()

            threading.Thread(target=do_connect, daemon=True).start()

        def logout_click(e):
            client.connected = False
            client.running   = False
            session["token"] = None
            show_login()

        def pin_changed(e):
            val = pin_switch.value
            try: page.window_always_on_top = val
            except:
                try: page.window.always_on_top = val
                except: pass
            page.update()

        pin_switch = ft.Switch(
            label="Sempre no Topo (Overlay)", 
            value=False, 
            on_change=pin_changed,
        )

        start_btn.on_click  = start_click
        logout_btn.on_click = logout_click

        # Monta o HUD
        hud_wrap.content = ft.Column([
            ft.Container(
                content=ft.Column([
                    vs_text, ac_text,
                    ft.Row([gs_text, alt_text, g_text], alignment="center", spacing=12),
                ], horizontal_alignment="center", spacing=4),
                padding=16, bgcolor=C_CARD, border_radius=12
            ),
            ft.Text("LOG DE VOO", size=11, weight="bold", color="white30"),
            ft.Container(content=event_list, bgcolor="#09131f", border_radius=10, height=160),
            score_wrap,
        ], spacing=10)

        ifc  = session.get("username_ifc") or "Piloto"
        name = session.get("full_name") or ""

        # Request POST_NOTIFICATIONS on Android 13+
        try:
            import os
            is_android = "ANDROID_ARGUMENT" in os.environ or os.path.exists("/system/app")
            if is_android:
                from java import jclass
                platform = jclass("com.chaquo.python.android.AndroidPlatform")
                activity = platform.getActivity()
                if activity:
                    Build = jclass("android.os.Build")
                    if Build.VERSION.SDK_INT >= 33: # TIRAMISU
                        ContextCompat = jclass("androidx.core.content.ContextCompat")
                        PackageManager = jclass("android.content.pm.PackageManager")
                        permission = "android.permission.POST_NOTIFICATIONS"
                        if ContextCompat.checkSelfPermission(activity, permission) != PackageManager.PERMISSION_GRANTED:
                            ActivityCompat = jclass("androidx.core.app.ActivityCompat")
                            String = jclass("java.lang.String")
                            perms = jclass("java.lang.reflect.Array").newInstance(String, 1)
                            perms[0] = permission
                            ActivityCompat.requestPermissions(activity, perms, 1001)
        except Exception as e:
            print(f"Failed to request Android permissions: {e}")

        def close_dlg(e):
            dlg.open = False
            page.update()

        def show_debug_logs(e):
            log_text = "\n".join(global_logger.logs) if global_logger.logs else "Nenhum log capturado."
            dlg.content.controls[0].value = log_text
            page.dialog = dlg
            dlg.open = True
            page.update()

        dlg = ft.AlertDialog(
            title=ft.Text("Logs do Sistema (Debug)"),
            content=ft.Column([
                ft.Text("", size=10, font_family="monospace", selectable=True)
            ], scroll="always", width=300, height=400),
            actions=[ft.TextButton("Fechar", on_click=close_dlg)]
        )

        btn_bug = ft.IconButton(icon=ft.Icons.BUG_REPORT, icon_color="white54", on_click=show_debug_logs)

        set_view([
            ft.Container(
                padding=ft.Padding(24, 16, 24, 16),
                content=ft.Column([
                    ft.Row([
                        ft.Column([
                            ft.Text("IF CREW CENTER", size=11, color=C_ACCENT, weight="bold"),
                            ft.Text(ifc,  size=22, weight="bold", color="white"),
                            ft.Text(name, size=12, color="white60"),
                        ], expand=True),
                        btn_bug,
                        logout_btn,
                    ]),
                    ft.Divider(color="white10"),
                    conn_status,
                    ft.Container(
                        content=start_btn,
                        padding=ft.Padding(0, 8, 0, 8)
                    ),
                    ft.Text("O app localizará o Infinite Flight automaticamente na rede.",
                            size=11, color="white30"),
                    pin_switch,
                    hud_wrap,
                ], horizontal_alignment="center", spacing=10)
            )
        ])

    show_login()


ft.app(target=main)
