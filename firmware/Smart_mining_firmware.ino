
#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <FirebaseClient.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>


// =================================================
// WIFI DETAILS
// =================================================

#define WIFI_SSID "wifi_name"
#define WIFI_PASSWORD "your_pass"


// =================================================
// FIREBASE DETAILS
// =================================================

#define API_KEY "your_api_key"

#define USER_EMAIL "your_email_for_authenticatiom"
#define USER_PASSWORD "authentication_password"

#define DATABASE_URL "https://mining-helmet-13d03-default-rtdb.asia-southeast1.firebasedatabase.app"


// =================================================
// PIN CONFIGURATION
// =================================================

#define gas A0
#define buzz D4
#define buzz_dash D3
#define dhtpin D6

#define DHTTYPE DHT11

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64


// =================================================
// SENSOR OBJECTS
// =================================================

DHT dht(dhtpin, DHTTYPE);

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

TinyGPSPlus gps;

SoftwareSerial gpsSerial(D5, D0);


// =================================================
// FIREBASE OBJECTS
// =================================================

WiFiClientSecure ssl_client;

using AsyncClient = AsyncClientClass;

AsyncClient aClient(ssl_client);

UserAuth user_auth(
  API_KEY,
  USER_EMAIL,
  USER_PASSWORD,
  3000
);

FirebaseApp app;

RealtimeDatabase Database;


// =================================================
// VARIABLES
// =================================================

int gas_val = 0;

float temp = 0;
float hum = 0;

bool gasAlert = false;
bool highTempAlert = false;
bool autoAlarm = false;

bool dashboardBuzzer = false;

bool buzzerReadPending = false;
bool firebaseReadyPrinted = false;

String alarmStatus = "NORMAL";


// =================================================
// TIMERS
// =================================================

unsigned long sensorTimer = 0;
unsigned long firebaseTimer = 0;
unsigned long commandTimer = 0;
unsigned long historyTimer = 0;
unsigned long wifiTimer = 0;


// =================================================
// FIREBASE CALLBACK
// =================================================

void processData(AsyncResult &aResult) {

  if (!aResult.isResult()) {
    return;
  }

  // FIREBASE EVENTS

  if (aResult.isEvent()) {

    Serial.print("EVENT: ");

    Serial.println(
      aResult.eventLog().message()
    );
  }


  // FIREBASE DEBUG

  if (aResult.isDebug()) {

    Serial.print("DEBUG: ");

    Serial.println(
      aResult.debug()
    );
  }


  // HANDLE ERRORS FIRST

  if (aResult.isError()) {

    Serial.println("\n===== FIREBASE ERROR =====");

    Serial.print("FAILED TASK: ");
    Serial.println(aResult.uid());

    Serial.print("ERROR: ");

    Serial.println(
      aResult.error().message()
    );

    Serial.print("ERROR CODE: ");

    Serial.println(
      aResult.error().code()
    );

    Serial.println("==========================");

    if (aResult.uid() == "buzzerTask") {

      buzzerReadPending = false;
    }

    return;
  }


  // HANDLE SUCCESSFUL RESPONSE

  if (aResult.available()) {

    Serial.print("SUCCESS TASK: ");
    Serial.println(aResult.uid());

    // DASHBOARD BUZZER RESPONSE

    if (aResult.uid() == "buzzerTask") {

      RealtimeDatabaseResult &result =
        aResult.to<RealtimeDatabaseResult>();

      dashboardBuzzer = result.to<bool>();

      digitalWrite(
        buzz_dash,
        dashboardBuzzer ? HIGH : LOW
      );

      Serial.print("Dashboard Buzzer: ");

      Serial.println(
        dashboardBuzzer ? "ON" : "OFF"
      );

      buzzerReadPending = false;
    }
  }
}


// =================================================
// SETUP
// =================================================

void setup() {

  // BUZZER INITIALIZATION

  pinMode(buzz, OUTPUT);

  pinMode(buzz_dash, OUTPUT);

  digitalWrite(buzz, LOW);

  digitalWrite(buzz_dash, LOW);


  // SERIAL INITIALIZATION

  Serial.begin(9600);

  gpsSerial.begin(9600);


  // DHT INITIALIZATION

  dht.begin();


  // OLED INITIALIZATION

  Wire.begin(D2, D1);

  if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        0x3C
      )) {

    Serial.println("OLED failed!");

    while (true);
  }

  display.clearDisplay();

  display.setTextColor(WHITE);

  display.setTextSize(1);

  display.setCursor(0, 0);

  display.println("MINING HELMET");

  display.println("Initializing...");

  display.display();


  // WIFI CONNECTION

  WiFi.mode(WIFI_STA);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {

    Serial.print(".");

    delay(300);
  }

  Serial.println();

  Serial.println("WiFi Connected!");

  Serial.print("IP Address: ");

  Serial.println(WiFi.localIP());


  // FIREBASE SSL CONFIGURATION

  ssl_client.setInsecure();

  ssl_client.setBufferSizes(4096, 1024);


  // FIREBASE AUTHENTICATION

  Serial.println("Initializing Firebase...");

  initializeApp(
    aClient,
    app,
    getAuth(user_auth),
    processData,
    "authTask"
  );


  // REALTIME DATABASE

  app.getApp<RealtimeDatabase>(Database);

  Database.url(DATABASE_URL);


  Serial.println("MINING HELMET STARTED");

  display.clearDisplay();

  display.setCursor(0, 0);

  display.println("MINING HELMET");

  display.println("WiFi Connected");

  display.println("Firebase Setup");

  display.display();

  delay(2000);
}


// =================================================
// READ SENSORS
// =================================================

void readSensors() {

  // GAS SENSOR

  gas_val = analogRead(gas);


  // DHT11 SENSOR

  temp = dht.readTemperature();

  hum = dht.readHumidity();


  // ALERT CONDITIONS

  gasAlert = gas_val > 400;

  highTempAlert = !isnan(temp) && temp > 35;

  autoAlarm = gasAlert || highTempAlert;


  // AUTOMATIC BUZZER

  digitalWrite(
    buzz,
    autoAlarm ? HIGH : LOW
  );


  // ALERT STATUS

  if (gasAlert && highTempAlert) {

    alarmStatus = "GAS_AND_HIGH_TEMP";
  }

  else if (gasAlert) {

    alarmStatus = "GAS_ALERT";
  }

  else if (highTempAlert) {

    alarmStatus = "HIGH_TEMP";
  }

  else {

    alarmStatus = "NORMAL";
  }
}


// =================================================
// SERIAL MONITOR
// =================================================

void showSerialData() {

  Serial.println("\n===== MINING HELMET =====");

  // GAS

  Serial.print("Gas: ");

  Serial.println(gas_val);


  // TEMPERATURE

  Serial.print("Temperature: ");

  if (isnan(temp)) {

    Serial.println("Sensor Error");
  }

  else {

    Serial.print(temp);

    Serial.println(" C");
  }


  // HUMIDITY

  Serial.print("Humidity: ");

  if (isnan(hum)) {

    Serial.println("Sensor Error");
  }

  else {

    Serial.print(hum);

    Serial.println(" %");
  }


  // GPS DATA

  if (gps.location.isValid()) {

    Serial.println("\n----- GPS DATA -----");

    Serial.print("Latitude: ");

    Serial.println(gps.location.lat(), 6);

    Serial.print("Longitude: ");

    Serial.println(gps.location.lng(), 6);

    Serial.print("Altitude: ");

    Serial.print(gps.altitude.meters());

    Serial.println(" meters");

    Serial.print("Speed: ");

    Serial.print(gps.speed.kmph());

    Serial.println(" km/h");

    Serial.print("Satellites: ");

    Serial.println(gps.satellites.value());

    Serial.print("HDOP: ");

    Serial.println(gps.hdop.hdop());
  }

  else {

    Serial.println("GPS: Waiting for valid fix...");
  }


  Serial.println("--------------------");

  Serial.print("Automatic Alarm: ");

  Serial.println(autoAlarm ? "ON" : "OFF");

  Serial.print("Dashboard Buzzer: ");

  Serial.println(dashboardBuzzer ? "ON" : "OFF");

  Serial.print("Status: ");

  Serial.println(alarmStatus);
}


// =================================================
// OLED DISPLAY
// =================================================

void showOLED() {

  display.clearDisplay();

  display.setCursor(0, 0);

  display.println("MINING HELMET");

  display.println("----------------");


  // GAS

  display.print("Gas: ");

  display.println(gas_val);


  // TEMPERATURE

  display.print("Temp: ");

  if (isnan(temp)) {

    display.println("Error");
  }

  else {

    display.print(temp);

    display.println(" C");
  }


  // HUMIDITY

  display.print("Humidity: ");

  if (isnan(hum)) {

    display.println("Error");
  }

  else {

    display.print(hum);

    display.println(" %");
  }


  display.println("----------------");

  display.println(alarmStatus);

  display.display();
}


// =================================================
// CREATE FIREBASE JSON DATA
// =================================================

object_t createFirebaseData() {

  bool gpsFix = gps.location.isValid();

  String payload = "";

  payload.reserve(650);


  // SENSOR DATA

  payload = "{\"sensors\":{";

  payload += "\"gas\":";

  payload += String(gas_val);

  payload += ",\"temperature\":";

  payload += isnan(temp) ? "0" : String(temp, 1);

  payload += ",\"humidity\":";

  payload += isnan(hum) ? "0" : String(hum, 1);

  payload += ",\"temperatureValid\":";

  payload += isnan(temp) ? "false" : "true";

  payload += ",\"humidityValid\":";

  payload += isnan(hum) ? "false" : "true";

  payload += "},";


  // GPS DATA

  payload += "\"gps\":{";

  payload += "\"gpsFix\":";

  payload += gpsFix ? "true" : "false";

  payload += ",\"latitude\":";

  payload += gpsFix ?
    String(gps.location.lat(), 6) : "0";

  payload += ",\"longitude\":";

  payload += gpsFix ?
    String(gps.location.lng(), 6) : "0";

  payload += ",\"altitude\":";

  payload += gps.altitude.isValid() ?
    String(gps.altitude.meters(), 2) : "0";

  payload += ",\"speed\":";

  payload += gps.speed.isValid() ?
    String(gps.speed.kmph(), 2) : "0";

  payload += ",\"satellites\":";

  payload += gps.satellites.isValid() ?
    String(gps.satellites.value()) : "0";

  payload += ",\"hdop\":";

  payload += gps.hdop.isValid() ?
    String(gps.hdop.hdop(), 2) : "0";

  payload += "},";


  // ALERT DATA

  payload += "\"alerts\":{";

  payload += "\"gasAlert\":";

  payload += gasAlert ? "true" : "false";

  payload += ",\"highTempAlert\":";

  payload += highTempAlert ? "true" : "false";

  payload += ",\"autoAlarm\":";

  payload += autoAlarm ? "true" : "false";

  payload += ",\"dashboardBuzzer\":";

  payload += dashboardBuzzer ? "true" : "false";

  payload += ",\"status\":\"";

  payload += alarmStatus;

  payload += "\"},";


  // DEVICE DATA

  payload += "\"device\":{";

  payload += "\"online\":true";

  payload += ",\"uptimeMs\":";

  payload += String(millis());

  payload += ",\"lastUpdate\":{\".sv\":\"timestamp\"}";

  payload += "}";

  payload += "}";


  // CONVERT JSON STRING TO FIREBASE OBJECT

  object_t telemetry(payload);

  return telemetry;
}


// =================================================
// SEND DATA TO FIREBASE
// =================================================

void uploadFirebaseData() {

  object_t telemetry = createFirebaseData();


  // UPDATE LATEST SENSOR DATA

  Database.set<object_t>(
    aClient,
    "/MiningHelmet/live",
    telemetry,
    processData,
    "liveUpload"
  );


  // SAVE HISTORICAL DATA EVERY 10 SECONDS

  if (millis() - historyTimer >= 10000) {

    historyTimer = millis();

    Database.push<object_t>(
      aClient,
      "/MiningHelmet/history",
      telemetry,
      processData,
      "historyUpload"
    );
  }
}


// =================================================
// READ DASHBOARD BUZZER COMMAND
// =================================================

void readDashboardCommand() {

  if (buzzerReadPending) {

    return;
  }

  buzzerReadPending = true;

  Database.get(
    aClient,
    "/MiningHelmet/commands/dashboardBuzzer",
    processData,
    false,
    "buzzerTask"
  );
}


// =================================================
// MAIN LOOP
// =================================================

void loop() {

  // KEEP FIREBASE RUNNING

  app.loop();


  // CONTINUOUS GPS READING

  while (gpsSerial.available()) {

    gps.encode(gpsSerial.read());
  }


  // FIREBASE AUTHENTICATION STATUS

  if (app.ready() && !firebaseReadyPrinted) {

    firebaseReadyPrinted = true;

    Serial.println("\nFIREBASE AUTHENTICATED!");

    Serial.print("User UID: ");

    Serial.println(app.getUid());
  }


  // WIFI RECONNECTION

  if (WiFi.status() != WL_CONNECTED) {

    if (millis() - wifiTimer >= 5000) {

      wifiTimer = millis();

      Serial.println("Reconnecting WiFi...");

      WiFi.reconnect();
    }
  }


  // READ SENSORS EVERY 2 SECONDS

  if (millis() - sensorTimer >= 2000) {

    sensorTimer = millis();

    readSensors();

    showSerialData();

    showOLED();
  }


  // FIREBASE OPERATIONS

  if (app.ready()) {


    // UPLOAD LIVE DATA EVERY 3 SECONDS

    if (millis() - firebaseTimer >= 3000) {

      firebaseTimer = millis();

      uploadFirebaseData();
    }


    // READ DASHBOARD COMMAND EVERY 3 SECONDS

    if (millis() - commandTimer >= 3000) {

      commandTimer = millis();

      readDashboardCommand();
    }
  }
}
