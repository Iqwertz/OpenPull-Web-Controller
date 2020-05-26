
/*########################################
  ##### OPEN PULL
  ##### DIY Universal Test Machnine, with ble and sd-card
  ##### V2.0
  ##### Stefan Hermann aka CNC Kitche
  ##### https://www.youtube.com/cnckitchen
  ##### 31.01.2019
  ##### Libraries:
  ##### HX711 by aguegu: https://github.com/aguegu/ardulibs/tree/master/hx711
  ##### Sd
  ##### SPI
  ########################################*/

/* Libraries */
#include "hx711.h"
//#include <AccelStepper.h>
#include <SPI.h>
#include <SD.h>

////// Load Cell Variables
float gainValue = -875.7 * (1 - 0.001); //CALIBRATION FACTOR
float measuringIntervall = .5;       //Measuring interval when IDLE
float measuringIntervallTest = .5;  //Measuring interval during SLOW test
float measuringIntervallTestFast = .15; ///Measuring interval during FAST test
bool InvertMeasurments = true;  //inverts the Measurments to positve Values
const int MinStrength = 50;  //Minimum Strength of the Tests (Used for Auto Abort)
const int BreakMin = 10; //When the Value is smaller than this the test gets aborted (Used for Auto Abort)

long tareValue;

int TestStopDifferenz = 200;
////// Stepper Variables

int pulseLength = 10;
long stepsPerMM = 39000;// 200 * 2 * (13 + 212.0 / 289.0) / 2; // Steps per rev * Microstepping * Gear reduction ratio / Pitch
float stepsPerSecond = stepsPerMM / 60; //1mm/min
int slowSpeedDelay = 3000;    //Time delay between steps for jogging slowly
int fastSpeedDelay = 300;     ////Time delay between steps for jogging fast
boolean dir = 0;

long MoveStepsMM = 39000;

////// PIN definitions
int directionPin = 2;
int stepPin = 3;
int enablePin = 8;
int speedPin = 5;
int upPin = 4;
int downPin = 10;
int led1Pin = 7;
int sdDetectPin = 12;



///// Variables
byte mode = 2;
byte modeAddition = 0;
float currentSpeed = stepsPerSecond;    //SLOW Test speed
float fastSpeed = 25 * stepsPerSecond;  //FAST Test speed (x25 = 25mm/min)
long currentMicros = micros();
long lastLoadValues = 0;
long lastStep = 0;
String inputString;
float maxForce = 0;
float loweringCounter = 0;
long startTime = 0;
long yMTestTime = 30 * 1000; //Modulus Test time for SLOW speed (=30s)
bool debug = false; //debug mode to test the remote
bool WriteToSD = false;
bool SdInserted = false;
float MeasurmentMaxValue = 0;
const int LastMaxValuesSize = 5;    //Amount of the Last Values
float LastMaxValues[LastMaxValuesSize]; //Circular Buffer of the Last Max Values
byte LastMaxValuesIndex = 0;

/////Library Config
Hx711 loadCell(A1, A2);
String RootFolderName = "OpenPull";
int LastFileIndex;
File Data;

void setup() {
  // Serial (Serial1 is ble)
  Serial.begin(115200);
  Serial1.begin(19200);

  // Sd ini
  pinMode(sdDetectPin, INPUT_PULLUP);

  if (digitalRead(sdDetectPin) == 0) {
    Serial.print("Initializing SD card...");
    if (!SD.begin()) {
      Serial.println("initialization failed!");
    } else {
      SdInserted = true;
    }
    Serial.println("initialization done.");
    delay(500);

    SdIni();
  }
  // Load Cell
  tareValue = loadCell.averageValue(32);

  // Stepper
  pinMode(directionPin, OUTPUT);
  pinMode(stepPin, OUTPUT);
  pinMode(enablePin, OUTPUT);
  digitalWrite(directionPin, dir);
  digitalWrite(stepPin, LOW);
  digitalWrite(enablePin, HIGH);

  //Up Button
  pinMode(upPin, INPUT);
  digitalWrite(upPin, HIGH);

  //Down Button
  pinMode(downPin, INPUT);
  digitalWrite(downPin, HIGH);

  //Speed Switch
  pinMode(speedPin, INPUT);
  digitalWrite(speedPin, HIGH);

  //LED Pin
  pinMode(led1Pin, OUTPUT);
  digitalWrite(led1Pin, LOW);
}

void loop() {
  /////////Sd
  CheckSd();

  /////////////Ble Settings

  int stringRead = 0;
  //Serial COmmunication
  inputString = "";
  while (Serial1.available())
  {
    inputString = Serial1.readString();

    if (inputString == "NEW") {
      BleNewTest();
    } else if (inputString == "SdStat") {
      if (!SdInserted) {
        Serial1.println("SDfalse");
      }
    }

    stringRead = 1;
  }

  while (Serial.available())
  {
    inputString = Serial.readString();
    stringRead = 1;
  }
  if (stringRead == 1) {
    String taskPart;
    String rest;
    taskPart = inputString.substring(0, inputString.indexOf(" "));
    rest = inputString.substring(inputString.indexOf(" ") + 1);
    if (taskPart == "S") {
      AbortTest();
    } else if (taskPart == "G0") {
      Move(rest.toInt());
    } else if (taskPart == "M10") { //Start SLOW test
      digitalWrite(enablePin, LOW);
      mode = 1;
      if (rest == "S1") {
        modeAddition = 1;
      }
      measuringIntervall = measuringIntervallTest;
      maxForce = 0;
      loweringCounter = 0;
      digitalWrite(directionPin, LOW);
      printSpaces(5);
      Log("Tare");
      tareValue = loadCell.averageValue(32);    //Tare
      Log("Start Test");
      digitalWrite(led1Pin, HIGH);
      delay(500);
      digitalWrite(led1Pin, LOW);
      delay(200);
      digitalWrite(led1Pin, HIGH);
      delay(500);
      digitalWrite(led1Pin, LOW);
    } else if (taskPart == "M11") { //manual Mode (not implemented yet)
      Log("Manual Mode");
      digitalWrite(enablePin, LOW);
      measuringIntervall = 2;
      mode = 2;
    } else if (taskPart == "M12") { //tare
      digitalWrite(enablePin, LOW);
      measuringIntervall = 2;
      Log("Tare");
      tareValue = loadCell.averageValue(32);
    } else if (taskPart == "M13") { //Youngs Modulus Test Mode
      digitalWrite(enablePin, LOW);
      mode = 4;
      measuringIntervall = measuringIntervallTest;
      maxForce = 0;
      loweringCounter = 0;
      digitalWrite(directionPin, LOW);
      printSpaces(5);
      Log("Tare");
      tareValue = loadCell.averageValue(32);
      Log("Start Test");
      digitalWrite(led1Pin, HIGH);
      delay(500);
      digitalWrite(led1Pin, LOW);
      delay(200);
      digitalWrite(led1Pin, HIGH);
      delay(500);
      digitalWrite(led1Pin, LOW);
      startTime = millis();
    } else if (taskPart == "M14") { //Start FAST test
      digitalWrite(enablePin, LOW);
      mode = 3;
      measuringIntervall = measuringIntervallTestFast;
      maxForce = 0;
      loweringCounter = 0;
      digitalWrite(directionPin, LOW);
      printSpaces(5);
      Log("Tare");
      tareValue = loadCell.averageValue(32);
      Log("Start Fast Test");
      digitalWrite(led1Pin, HIGH);
      delay(500);
      digitalWrite(led1Pin, LOW);
      delay(200);
      digitalWrite(led1Pin, HIGH);
      delay(500);
      digitalWrite(led1Pin, LOW);
    } else {
      Log("ERROR: Command not found!");
    }
  }
  ///////////////// Tensile Test Mode ////////////
  if (mode == 1) {
    TensileTest();

    ///////////////// MANUAL MODE //////////////////
  } else if (mode == 2) {
    ManualMode();
    // Fast Test Mode
  } else if (mode == 3) {
    FastTest();
    // Youngs Modulus Test
  } else if (mode == 4) {
    YoungsModule();
  }

  ///////////// Get load value
  currentMicros = micros();
  if ((micros() - lastLoadValues) >= measuringIntervall * 1000000) {
    digitalWrite(led1Pin, HIGH);
    float loadValue = CalcLoadValue();
    Serial.println(loadValue);
    Serial1.println(String("V") + loadValue);
    if (WriteToSD) {
      File TestFile = SD.open(RootFolderName + "/" + LastFileIndex + ".txt", FILE_WRITE);
      TestFile.println(loadValue + String(","));
      TestFile.close();
    }
    digitalWrite(led1Pin, LOW);
    lastLoadValues = currentMicros;
    if (mode == 1 && modeAddition == 1) {
      if (loadValue >= maxForce) {
        maxForce = loadValue;
        loweringCounter = 0;
      } else {
        loweringCounter++;
      }
      if (loweringCounter >= 20) {
        currentSpeed = currentSpeed * 4;
        modeAddition = 0;
      }
    }

    if (mode != 2) {
      if (loadValue > MeasurmentMaxValue) {
        MeasurmentMaxValue = loadValue;
      }

      PushToBuffer(loadValue);

      if (MeasurmentMaxValue > MinStrength) {
        if (loadValue < BreakMin) {
          AbortTest();
        }
      }
    }
  }
}

float CalcLoadValue() {
  float lV = (loadCell.averageValue(1) - tareValue) / gainValue;
  if (InvertMeasurments) {
    lV = lV * -1;
  }
  return lV;
}

void Move(int distance) {  //This function moves the Maschine the given amount of mm
  digitalWrite(enablePin, LOW);
  Serial.println(distance);
  if (distance < 0) {
    digitalWrite(directionPin, HIGH);
  } else {
    digitalWrite(directionPin, LOW);
  }
  long Steps = MoveStepsMM * abs(distance);

  long LastMillis = millis();

  for (long i = 0; i <= Steps; i++) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(4);
    digitalWrite(stepPin, LOW);

    if (Serial1.available()) {
      if (Serial1.readString() == "S ") {
        i = Steps;
      }
    }

    /////This can be used to stop move when there is a load on it but then the motors will click every .5 s, due to the time it takes to read the LoadCell
    /*
      if (millis() - LastMillis >= 500) {
      float CValue = CalcLoadValue();
      if (CValue >= 20) {
        i = Steps;
      }
      LastMillis = millis();

      } */
  }
  delay(100);
  digitalWrite(enablePin, HIGH);
}

void printSpaces(int numberOfSpaces) { //This function will print a given amount of empty lines
  for (int i = numberOfSpaces; i > 0; i--) {
    Log("");
  }
}

void Log(String msg) {
  Serial.println(msg);
  //  Serial1.println("C" + msg);
}

void TensileTest() {
  currentMicros = micros();
  if ((currentMicros - lastStep) >= 1000000. / currentSpeed) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(pulseLength);
    digitalWrite(stepPin, LOW);
    lastStep = currentMicros;
  }
  if (!digitalRead(downPin)) { //Stop test if DOWN Button is pressed
    AbortTest();
  }

}

void ManualMode() {
  boolean performStep = 0;
  if (!digitalRead(upPin)) {
    digitalWrite(directionPin, LOW);
    performStep = 1;
    if (debug) {
      Log("UP");
    }
  } else if (!digitalRead(downPin)) {
    digitalWrite(directionPin, HIGH);
    performStep = 1;
    if (debug) {
      Log("DOWN");
    }
  }
  //Perform Step
  if (performStep) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(pulseLength);
    digitalWrite(stepPin, LOW);
  }
  if (digitalRead(speedPin)) {
    delayMicroseconds(slowSpeedDelay);
    if (debug) {
      Log("Slow Speed");
    }
  } else {
    delayMicroseconds(fastSpeedDelay);
    if (debug) {
      Log("Fast Speed");
    }
  }

}

void FastTest() {
  currentMicros = micros();
  if ((currentMicros - lastStep) >= 1000000. / fastSpeed) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(pulseLength);
    digitalWrite(stepPin, LOW);
    lastStep = currentMicros;
  }
  if (!digitalRead(downPin)) {
    AbortTest();
  }
}

void YoungsModule() {
  currentMicros = micros();
  if ((currentMicros - lastStep) >= 1000000. / currentSpeed) {
    digitalWrite(stepPin, HIGH);
    delayMicroseconds(pulseLength);
    digitalWrite(stepPin, LOW);
    lastStep = currentMicros;
  }
  if (millis() - startTime >= yMTestTime) {
    mode = 3;
    measuringIntervall = measuringIntervallTestFast;
  }
  if (!digitalRead(downPin)) {
    AbortTest();
  }
}

void AbortTest() {
  Log("Test aborted - entering manual mode");
  if (SdInserted) {
    float Break = 0;
    for (int i = 0; i < LastMaxValuesSize; i++) {
      if (Break <= LastMaxValues[i]){
        Break = LastMaxValues[i];
      }
    }

    File TestFile = SD.open(RootFolderName + "/" + LastFileIndex + ".txt", FILE_WRITE);
    TestFile.println(0);
    TestFile.println("],");
    TestFile.println(String("\"BreakPoint\":") + Break + String(","));
    TestFile.println(String("\"Maximum\":") + MeasurmentMaxValue);
    TestFile.println("}");
    TestFile.close();
  }
  Serial1.println("FinTest");
  printSpaces(5);
  WriteToSD = false;
  mode = 2;
  modeAddition = 0;
  measuringIntervall = .5;
  currentSpeed = stepsPerSecond;
  MeasurmentMaxValue = 0;
  digitalWrite(enablePin, HIGH);
}

void GetLastSdIndex() {
  File Index;
  if (SD.exists(RootFolderName + "/INDEX.txt")) {
    String i;
    Index = SD.open(RootFolderName + "/INDEX.txt");
    if (Index.available())
    {
      i = Index.readStringUntil(';');
    }
    LastFileIndex = i.toInt();
    Index.close();
  } else {
    Index = SD.open(RootFolderName + "/INDEX.txt", FILE_WRITE);
    Index.println("0;");
    Index.close();
    LastFileIndex = 0;
  }
}

//this function handles the new test send protocol
//The Send Protocoll is:
//The PC sends "NEW" to make a new File on the maschine and set it into testdata recieve mode
//The Maschine sends "OK NEW" to confirm that a new test is started
//The PC sends the string of the first index in the BleAddTestSendArray
//The Maschine receives the data and sends it back
//The Pc check if the sent data was correct. If it was it sends "OK" and the next line. In not it sends "FALSE" and it resends the same data with a delay of 300milliseconds to avoid "gatt opertion in progress" error
//If the Maschine receives "OK" it writes the last data to the current file and it sends the new received data back, if "FALSE" or anything else it delets the received data
//This sending loop repeats until every string in the BleAddTestSendArray is sent
//When everything in the BleAddTestSendArray is sent the Pc sents "OKEND " with the Test Mode
//WHen the Maschine receives "OKEND" it closes the opened file and starts the test with the received test mode

//I implemented this send protocol to make sure the sent data is 100% correct (When developing I often had faulty data which destroyed everything)

void BleNewTest() {
  File NewTest;
  if (SdInserted) {
    LastFileIndex++;
    File N;
    N = SD.open(RootFolderName + "/INDEX.txt", O_READ | O_WRITE | O_CREAT | O_TRUNC);
    N.println(LastFileIndex);
    N.close();

    NewTest = SD.open(RootFolderName + "/" + LastFileIndex + ".txt", FILE_WRITE);
    Serial1.println("OK NEW");
    Serial.println("New Test");
  }
  bool FinishedIni = false;
  String LastString = "";
  String NextInput = "";

  while (!FinishedIni) {
    if (Serial1.available() || NextInput != "") {
      String s;
      if (Serial1.available()) {
        s = Serial1.readString();
      } else {
        s = NextInput;
        NextInput = "";
      }
      Serial.println(s);
      if (LastString == "") {
        if (s.substring(0, s.indexOf(" ")) == "END") {
          FinishedIni = true;
          if (SdInserted) {
            NewTest.println("\"Data\": [");
            NewTest.close();
            WriteToSD = true;
          }
          inputString = s.substring(s.indexOf(" ") + 1) + " ";
          Serial1.println("Finished");
        } else {
          LastString = s;
          Serial1.println(LastString);
          Serial.println(LastString);
        }
      } else if (s.substring(0, 2) == "OK") {
        if (SdInserted) {
          NewTest.println(LastString);
        }
        Serial.println(LastString);
        LastString = "";
        NextInput = s.substring(2);
      } else {
        Serial.println("Deleted Line");
        LastString = "";
      }
    }
  }
}

void PushToBuffer(int V) {
  LastMaxValuesIndex++;
  if (LastMaxValuesIndex == LastMaxValuesSize) {
    LastMaxValuesIndex = 0;
  }
  LastMaxValues[LastMaxValuesIndex] = V;
}

void CheckSd() {
  if (SdInserted) {
    if (digitalRead(sdDetectPin) == 1) {
      SdInserted = false;
      Serial1.println("AAttention! Sd Card got removed. No data will be recorded");
    }
  } else {
    if (digitalRead(sdDetectPin) == 0) {
      delay(100);
      if (SD.begin()) {
        SdInserted = true;
        delay(500);
        SdIni();
        Serial1.println("ASd Card got Inserted");
      }
    }
  }
}

//////Function that Initializes Sd Card and Creates Directory if missing
void SdIni() {
  if (SdInserted) {
    SD.mkdir("/" + RootFolderName);
    GetLastSdIndex();
  }
}
