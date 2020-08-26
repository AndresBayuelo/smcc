#include <LiquidCrystal_I2C.h>
#include "DHT.h"
#include <SoftwareSerial.h>
#include <TinyGPS.h>
#include <WiFi.h>
#include <HTTPClient.h>

int lcdColumns = 16;
int lcdRows = 2;
LiquidCrystal_I2C lcd(0x27, lcdColumns, lcdRows);

#define DHTPIN 5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

TinyGPS gps;
SoftwareSerial ss(35, 34);

const int relay1 = 19;
const int relay2 = 18;

#define ssrhumsuelo 27
const String id = "A1";

void getTmpHmd(){

  float h = dht.readHumidity();
  float t = dht.readTemperature();
  float f = dht.readTemperature(true);

  if (isnan(h) || isnan(t) || isnan(f)) {
    Serial.println(F("Failed to read from DHT sensor!"));
    return;
  }

  float hif = dht.computeHeatIndex(f, h);
  float hic = dht.computeHeatIndex(t, h, false);
  String hg = (digitalRead(ssrhumsuelo) ? "LOW" : "HIGH");

  Serial.print(F("Humidity ground: "));
  Serial.print(hg);
  Serial.print(F(" Humidity: "));
  Serial.print(h);
  Serial.print(F("%  Temperature: "));
  Serial.print(t);
  Serial.print(F("°C "));
  Serial.print(f);
  Serial.print(F("°F  Heat index: "));
  Serial.print(hic);
  Serial.print(F("°C "));
  Serial.print(hif);
  Serial.println(F("°F"));

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("H "); lcd.print(h); lcd.print("% ");
  lcd.print("HG "); lcd.print(hg);
  lcd.setCursor(0, 1);
  lcd.print(t); lcd.print("C ");
  lcd.print(f); lcd.print("F");

  sendDataHTTP("id=" + id + "&hmd=" + h + "&hmdg=" + hg + "&tempc=" + t + "&tempf=" + f + "", "http://192.168.1.124:3000/registro_sgmoperacional");

}

void getGPS(){
  bool newData = false;
  unsigned long chars;
  unsigned short sentences, failed;

  for (unsigned long start = millis(); millis() - start < 1000;)
  {
    while (ss.available())
    {
      char c = ss.read();
      if (gps.encode(c))
        newData = true;
    }
  }

  if (newData)
  {
    float flat, flon;
    unsigned long age;
    gps.f_get_position(&flat, &flon, &age);
    Serial.print("LAT=");
    Serial.print(flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flat, 6);
    Serial.print(" LON=");
    Serial.print(flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flon, 6);
    Serial.print(" SAT=");
    Serial.print(gps.satellites() == TinyGPS::GPS_INVALID_SATELLITES ? 0 : gps.satellites());
    Serial.print(" PREC=");
    Serial.println(gps.hdop() == TinyGPS::GPS_INVALID_HDOP ? 0 : gps.hdop());

    lcd.clear(); 
    lcd.setCursor(0, 0);
    lcd.print("LAT="); lcd.print(flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flat, 6);
    lcd.setCursor(0, 1);
    lcd.print("LON="); lcd.print(flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : flon, 6);

    sendDataHTTP("id=" + id + "&latitud=" + (flat == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : (flat*1000000))
        + "&longitud=" + (flon == TinyGPS::GPS_INVALID_F_ANGLE ? 0.0 : (flon*1000000))
        + "", "http://192.168.1.124:3000/actualizar_loc");

  }
  
  gps.stats(&chars, &sentences, &failed);
  Serial.print(" CHARS=");
  Serial.print(chars);
  Serial.print(" SENTENCES=");
  Serial.print(sentences);
  Serial.print(" CSUM ERR=");
  Serial.println(failed);
  if (chars == 0)
    Serial.println("** No characters received from GPS: check wiring **");
}

const char* ssid = "RED HOME 2.4G INV";
const char* password = "14151682";
WiFiServer server(80);

void connectWIFI(){
  Serial.print("Connecting to ");
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Conectando...");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  lcd.clear();
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  server.begin();
}

String header;
String output19State = "off";
String output18State = "off";
unsigned long currentTime = millis();
unsigned long previousTime = 0; 
const long timeoutTime = 2000;

void webServer(){
  WiFiClient client = server.available();

  if (client) {
    currentTime = millis();
    previousTime = currentTime;
    Serial.println("New Client.");
    String currentLine = "";
    while (client.connected() && currentTime - previousTime <= timeoutTime) {
      currentTime = millis();
      if (client.available()) {
        char c = client.read();
        Serial.write(c);
        header += c;
        if (c == '\n') {

          if (currentLine.length() == 0) {
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println("Connection: close");
            client.println();

            if (header.indexOf("GET /19") >= 0){
              if(output19State == "on"){
                output19State = "off";
                digitalWrite(relay2, HIGH);
              }else if(output19State == "off"){
                output19State = "on";
                digitalWrite(relay2, LOW);
              }
            } else if (header.indexOf("GET /18") >= 0){
              if(output18State == "on"){
                output18State = "off";
                digitalWrite(relay1, HIGH);
              }else if(output18State == "off"){
                output18State = "on";
                digitalWrite(relay1, LOW);
              }
            }
            client.println();
            break;
          } else {
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }
    header = "";
    client.stop();
    Serial.println("Client disconnected.");
    Serial.println("");
  }
}

void sendDataHTTP(String data, String serverName){
  if(WiFi.status()== WL_CONNECTED){
    HTTPClient http;
    http.begin(serverName);

    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    
    String httpRequestData = data;

    Serial.print("httpRequestData: ");
    Serial.println(httpRequestData);
    
    int httpResponseCode = http.POST(httpRequestData);
        
    if (httpResponseCode>0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    }
    else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  }
  else {
    Serial.println("WiFi Disconnected");
  }
}

void setup(){

  Serial.begin(115200);
  lcd.init();                    
  lcd.backlight();
  dht.begin();
  ss.begin(9600);

  pinMode(relay1, OUTPUT);
  pinMode(relay2, OUTPUT);

  // LOW -> prendido, HIGH -> apagado 
  digitalWrite(relay1, HIGH);
  digitalWrite(relay2, HIGH);

  pinMode(ssrhumsuelo,INPUT_PULLUP);
  
  Serial.println(WiFi.macAddress());
  connectWIFI();
  Serial.println(WiFi.localIP());
  sendDataHTTP("id=" + id + "&ip=" + WiFi.localIP().toString() + "", "http://192.168.1.124:3000/actualizar_ip");

}

long timePrintGPS = currentTime + (5000);
long timePrintTmpHmd = currentTime + (10000);

void loop(){

  webServer();

  currentTime = millis();

  if(timePrintGPS == currentTime){
    getGPS();
    timePrintGPS = timePrintTmpHmd + (5000);
  }
  else if (timePrintTmpHmd == currentTime){
    getTmpHmd();
    timePrintTmpHmd = timePrintTmpHmd + (10000);
  }

}
